import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { afterEach, expect, test, vi } from "vitest";
import {
  buildObjectKey,
  createUploadService,
  sanitizeFileName,
  validateUpload,
} from "../src/upload.js";

const config = {
  accountId: "test-account",
  accessKeyId: "test-access",
  secretAccessKey: "test-secret",
  bucket: "uploads",
  publicBaseUrl: "https://cdn.example.test/files/",
};
const rules = { maxFileSize: 100, allowedMimeTypes: ["image/png"] };
const request = {
  scope: "avatars",
  ownerId: "user-1",
  fileName: "photo.png",
  mimeType: "image/png",
  size: 42,
};
afterEach(() => vi.restoreAllMocks());

test("invalid R2 configuration fails before signing or making a request", () => {
  expect(() =>
    createUploadService({ ...config, accountId: "https://other.test" }, rules),
  ).toThrow("Invalid R2 configuration");
  for (const publicBaseUrl of [
    "file:///tmp",
    "https://cdn.test?token=x",
    "https://cdn.test/#file",
    "https://user:pass@cdn.test/",
  ]) {
    expect(() =>
      createUploadService({ ...config, publicBaseUrl }, rules),
    ).toThrow("Invalid R2 public URL");
  }
  expect(() =>
    createUploadService(config, { ...rules, maxFileSize: NaN }),
  ).toThrow("Invalid upload size limit");
});

test("file names cannot escape namespaces and keys are unique", () => {
  expect(sanitizeFileName("../../photo name.png")).toBe("photo_name.png");
  expect(sanitizeFileName("C:\\temp\\photo.png")).toBe("photo.png");
  expect(sanitizeFileName(".../..")).toBe("");
  const key = buildObjectKey("avatars", "user-1", "photo.png");
  expect(key).toMatch(/^avatars\/user-1\/[\da-f-]{36}-photo\.png$/);
  expect(buildObjectKey("avatars", "user-1", "photo.png")).not.toBe(key);
  expect(() => buildObjectKey("../other", "user-1", "photo.png")).toThrow(
    "Invalid",
  );
  expect(() => buildObjectKey("avatars", "../user", "photo.png")).toThrow(
    "Invalid",
  );
});

test("upload validation rejects invalid type, names, size and non-finite inputs", async () => {
  expect(validateUpload(request, rules)).toBeNull();
  expect(validateUpload({ ...request, size: 100 }, rules)).toBeNull();
  for (const size of [101, -1, NaN, Infinity, 1.5])
    expect(validateUpload({ ...request, size }, rules)).toBe("FILE_TOO_LARGE");
  expect(validateUpload({ ...request, mimeType: "text/html" }, rules)).toBe(
    "INVALID_TYPE",
  );
  expect(validateUpload({ ...request, fileName: ".." }, rules)).toBe(
    "INVALID_NAME",
  );
  expect(validateUpload({ ...request, ownerId: "../owner" }, rules)).toBe(
    "INVALID_NAME",
  );
  await expect(
    createUploadService(config, rules).presignPut({ ...request, size: 101 }),
  ).rejects.toMatchObject({ statusCode: 400, code: "FILE_TOO_LARGE" });
});

test("real SDK signs PUT and GET locally with constrained headers and expiry", async () => {
  const send = vi.spyOn(S3Client.prototype, "send").mockImplementation(() => {
    throw new Error("Network forbidden");
  });
  const service = createUploadService(config, rules);
  const before = Date.now();
  const upload = await service.presignPut(request);
  const url = new URL(upload.url);
  expect(url.hostname).toContain("test-account.r2.cloudflarestorage.com");
  expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
  expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[\da-f]{64}$/);
  expect(url.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toEqual(
    expect.arrayContaining(["content-length", "content-type", "host"]),
  );
  expect(upload.method).toBe("PUT");
  expect(upload.headers).toEqual({
    "content-type": "image/png",
    "content-length": "42",
  });
  expect(Date.parse(upload.expiresAt)).toBeGreaterThanOrEqual(before + 900000);
  expect(upload.publicUrl).toBe(`https://cdn.example.test/files/${upload.key}`);
  expect(
    new URL(await service.presignGet(upload.key, 60)).searchParams.get(
      "X-Amz-Expires",
    ),
  ).toBe("60");
  for (const expiry of [0, -1, 604801, NaN, 1.5])
    await expect(service.presignGet(upload.key, expiry)).rejects.toThrow(
      RangeError,
    );
  await expect(service.presignGet("../private")).rejects.toMatchObject({
    code: "INVALID_NAME",
  });
  expect(send).not.toHaveBeenCalled();
});

test("head and remove use SDK commands; only missing objects become null", async () => {
  const send = vi.spyOn(S3Client.prototype, "send");
  send.mockResolvedValueOnce({
    ContentLength: 42,
    ContentType: "image/png",
  } as never);
  const service = createUploadService(config, rules);
  expect(await service.head("avatars/user-1/photo.png")).toEqual({
    size: 42,
    mimeType: "image/png",
  });
  expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
  expect(send.mock.calls[0][0].input).toEqual({
    Bucket: "uploads",
    Key: "avatars/user-1/photo.png",
  });
  send.mockRejectedValueOnce(
    Object.assign(new Error("missing"), { name: "NotFound" }),
  );
  expect(await service.head("missing")).toBeNull();
  send.mockRejectedValueOnce(
    Object.assign(new Error("denied"), { $metadata: { httpStatusCode: 403 } }),
  );
  await expect(service.head("private")).rejects.toThrow("denied");
  send.mockResolvedValueOnce({} as never);
  await service.remove("avatars/user-1/photo.png");
  expect(send.mock.calls.at(-1)?.[0].constructor.name).toBe(
    "DeleteObjectCommand",
  );
});
