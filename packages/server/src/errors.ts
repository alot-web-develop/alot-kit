import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { fail } from "./response.js";

class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
      throw new RangeError("HttpError statusCode must be between 400 and 599");
    }
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Returns a `400 BAD_REQUEST` error.
 *
 * @param message - Human-readable message.
 * @param details - Optional structured details.
 */
const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, "BAD_REQUEST", message, details);

/**
 * Returns a `401 UNAUTHORIZED` error.
 *
 * @param message - Human-readable message (defaults to a generic phrasing).
 */
const unauthorized = (message = "Authentication required") =>
  new HttpError(401, "UNAUTHORIZED", message);

/**
 * Returns a `403 FORBIDDEN` error.
 *
 * @param message - Human-readable message (defaults to "Forbidden").
 */
const forbidden = (message = "Forbidden") =>
  new HttpError(403, "FORBIDDEN", message);

/**
 * Returns a `404 NOT_FOUND` error.
 *
 * @param message - Human-readable message (defaults to "Not found").
 */
const notFound = (message = "Not found") =>
  new HttpError(404, "NOT_FOUND", message);

/**
 * Returns a `409 CONFLICT` error.
 *
 * @param message - Human-readable message.
 * @param details - Optional structured details.
 */
const conflict = (message: string, details?: unknown) =>
  new HttpError(409, "CONFLICT", message, details);

const isFastifyError = (
  error: unknown,
): error is FastifyError & { statusCode: number } =>
  error instanceof Error &&
  "statusCode" in error &&
  typeof error.statusCode === "number";

/**
 * Fastify error handler mapping thrown errors to the kit envelope format.
 *
 * Handles {@link HttpError}, Fastify validation errors, and `ZodError` as
 * 4xx responses; any unknown error is logged and returned as a `500`.
 */
const errorHandler = (
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof HttpError && error.statusCode < 500) {
    return reply
      .status(error.statusCode)
      .send(fail(error.code, error.message, error.details));
  }
  if (isFastifyError(error) && error.validation) {
    const details = {
      context: error.validationContext,
      issues: error.validation,
    };
    return reply
      .status(400)
      .send(fail("VALIDATION_ERROR", "Request validation failed", details));
  }
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send(
        fail("VALIDATION_ERROR", "Request validation failed", error.issues),
      );
  }
  if (
    isFastifyError(error) &&
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  ) {
    return reply
      .status(error.statusCode)
      .send(fail(error.code ?? "BAD_REQUEST", error.message));
  }
  request.log.error({ err: error }, "unhandled error");
  return reply
    .status(500)
    .send(fail("INTERNAL_ERROR", "An unexpected error occurred"));
};

/** Fastify 404 handler returning a `NOT_FOUND` envelope for unmatched routes. */
const notFoundHandler = (request: FastifyRequest, reply: FastifyReply) =>
  reply
    .status(404)
    .send(
      fail("NOT_FOUND", `Route ${request.method} ${request.url} not found`),
    );

export {
  badRequest,
  conflict,
  errorHandler,
  forbidden,
  HttpError,
  notFound,
  notFoundHandler,
  unauthorized,
};
