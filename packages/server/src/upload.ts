import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpError } from "./errors.js";

type TR2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl?: string;
};
type TUploadRules = {
  maxFileSize: number;
  allowedMimeTypes: readonly string[];
};
type TUploadRequest = {
  scope: string;
  ownerId: string;
  fileName: string;
  mimeType: string;
  size: number;
};
type TUploadErrorCode = "FILE_TOO_LARGE" | "INVALID_TYPE" | "INVALID_NAME";
type TPresignedUpload = {
  key: string;
  url: string;
  method: "PUT";
  headers: { "content-type": string; "content-length": string };
  expiresAt: string;
  publicUrl?: string;
};
type TUploadService = {
  presignPut: (request: TUploadRequest) => Promise<TPresignedUpload>;
  presignGet: (key: string, expiresInSeconds?: number) => Promise<string>;
  head: (key: string) => Promise<{ size: number; mimeType: string } | null>;
  remove: (key: string) => Promise<void>;
};

/**
 * Normalizes a user-supplied filename for safe object-key composition: NFKC
 * normalization, backslash-to-slash conversion, path traversal stripping,
 * restricted character replacement, and a 200-character cap.
 *
 * @param fileName - The original filename.
 * @returns A sanitized filename, or an empty string when nothing survives.
 */
const sanitizeFileName = (fileName: string): string => {
  const basename = fileName
    .normalize("NFKC")
    .replaceAll("\\", "/")
    .split("/")
    .at(-1);
  if (basename === undefined) return "";
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 200);
};

const validSegment = (value: string) => /^[a-zA-Z0-9_-]+$/.test(value);

/** A request has a usable name only when its segments are all valid. */
const hasValidName = (request: TUploadRequest): boolean =>
  validSegment(request.scope) &&
  validSegment(request.ownerId) &&
  sanitizeFileName(request.fileName) !== "";

const invalidNameError = (): HttpError =>
  new HttpError(400, "INVALID_NAME", "Invalid upload name or namespace");

/**
 * Composes a namespaced object key from a validated scope, owner, and a
 * sanitized filename. Throws a `400 INVALID_NAME` when any segment is unsafe.
 *
 * @param scope - Namespace segment (alphanumeric, `-`, `_`).
 * @param ownerId - Owner segment (alphanumeric, `-`, `_`).
 * @param fileName - Original filename to sanitize and append.
 * @returns A key of the form `<scope>/<ownerId>/<uuid>-<name>`.
 */
const buildObjectKey = (
  scope: string,
  ownerId: string,
  fileName: string,
): string => {
  const name = sanitizeFileName(fileName);
  if (!validSegment(scope) || !validSegment(ownerId) || !name) {
    throw invalidNameError();
  }
  return `${scope}/${ownerId}/${randomUUID()}-${name}`;
};

/**
 * Validates an upload request against size, MIME type, and name rules.
 *
 * @param request - The upload request to validate.
 * @param rules - Size and MIME type constraints.
 * @returns The offending error code, or `null` when the request is valid.
 */
const validateUpload = (
  request: TUploadRequest,
  rules: TUploadRules,
): TUploadErrorCode | null => {
  const sizeInvalid =
    !Number.isSafeInteger(request.size) ||
    request.size < 0 ||
    request.size > rules.maxFileSize;

  if (!hasValidName(request)) return "INVALID_NAME";
  if (sizeInvalid) return "FILE_TOO_LARGE";
  if (!rules.allowedMimeTypes.includes(request.mimeType)) return "INVALID_TYPE";
  return null;
};

/** Whether an AWS/S3 error indicates a missing object. */
const isNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.name === "NotFound") return true;
  if (!("$metadata" in error)) return false;
  const metadata = error.$metadata as { httpStatusCode?: number } | null;
  return metadata?.httpStatusCode === 404;
};

const UPLOAD_TTL_SECONDS = 900;
const MAX_TTL_SECONDS = 604800;

/** Validates the R2 account configuration, throwing on any invalid field. */
const assertValidConfig = (config: TR2Config): void => {
  const accountIdInvalid = !/^[a-zA-Z0-9-]+$/.test(config.accountId);
  const missingField =
    !config.bucket.trim() || !config.accessKeyId || !config.secretAccessKey;
  if (accountIdInvalid || missingField) {
    throw new Error("Invalid R2 configuration");
  }
};

/** Validates the upload size limit, throwing when it is not a safe integer. */
const assertValidSizeLimit = (rules: TUploadRules): void => {
  if (!Number.isSafeInteger(rules.maxFileSize) || rules.maxFileSize < 0) {
    throw new Error("Invalid upload size limit");
  }
};

/**
 * Resolves and validates the optional public base URL, returning it as a URL
 * or `undefined`. The URL must be HTTP(S) with no query, fragment, or
 * credentials.
 */
const resolvePublicBaseUrl = (config: TR2Config): URL | undefined => {
  const publicBase = config.publicBaseUrl
    ? new URL(config.publicBaseUrl)
    : undefined;
  if (publicBase === undefined) return undefined;

  const hasInvalidExtras =
    !["https:", "http:"].includes(publicBase.protocol) ||
    publicBase.search ||
    publicBase.hash ||
    publicBase.username ||
    publicBase.password;
  if (hasInvalidExtras) throw new Error("Invalid R2 public URL");

  return publicBase;
};

/** Builds the public URL for an object key using the configured base URL. */
const publicUrlFor = (
  publicBase: URL | undefined,
  key: string,
): string | undefined => {
  if (publicBase === undefined) return undefined;
  const base = publicBase.href.replace(/\/$/, "");
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${path}`;
};

/** Storage transport only: callers authorize namespaces/keys and persist metadata. */
const createUploadService = (
  config: TR2Config,
  rules: TUploadRules,
): TUploadService => {
  assertValidConfig(config);
  assertValidSizeLimit(rules);
  const publicBase = resolvePublicBaseUrl(config);
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // R2 does not require the SDK's optional AWS checksum/trailer extensions.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const object = (key: string) => {
    if (
      !key ||
      key.startsWith("/") ||
      key.split("/").some((part) => !part || part === "." || part === "..")
    ) {
      throw new HttpError(400, "INVALID_NAME", "Invalid object key");
    }
    return { Bucket: config.bucket, Key: key };
  };
  return {
    async presignPut(request) {
      const error = validateUpload(request, rules);
      if (error) throw new HttpError(400, error, "Invalid upload");
      const key = buildObjectKey(
        request.scope,
        request.ownerId,
        request.fileName,
      );
      const expiresAt = new Date(
        Date.now() + UPLOAD_TTL_SECONDS * 1000,
      ).toISOString();
      const publicUrl = publicUrlFor(publicBase, key);
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          ...object(key),
          ContentType: request.mimeType,
          ContentLength: request.size,
        }),
        {
          expiresIn: UPLOAD_TTL_SECONDS,
          signableHeaders: new Set(["content-type", "content-length"]),
        },
      );
      return {
        key,
        url,
        method: "PUT",
        headers: {
          "content-type": request.mimeType,
          "content-length": String(request.size),
        },
        expiresAt,
        ...(publicUrl === undefined ? {} : { publicUrl }),
      };
    },
    async presignGet(key, expiresInSeconds = UPLOAD_TTL_SECONDS) {
      if (
        !Number.isInteger(expiresInSeconds) ||
        expiresInSeconds < 1 ||
        expiresInSeconds > MAX_TTL_SECONDS
      ) {
        throw new RangeError("Expiry must be between 1 and 604800 seconds");
      }
      return getSignedUrl(client, new GetObjectCommand(object(key)), {
        expiresIn: expiresInSeconds,
      });
    },
    async head(key) {
      try {
        const result = await client.send(new HeadObjectCommand(object(key)));
        return {
          size: result.ContentLength ?? 0,
          mimeType: result.ContentType ?? "application/octet-stream",
        };
      } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
      }
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand(object(key)));
    },
  };
};

export type {
  TPresignedUpload,
  TR2Config,
  TUploadErrorCode,
  TUploadRequest,
  TUploadRules,
  TUploadService,
};
export {
  buildObjectKey,
  createUploadService,
  sanitizeFileName,
  validateUpload,
};
