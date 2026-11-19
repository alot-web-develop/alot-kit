import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { expect, test, vi } from "vitest";
import { z } from "zod";
import {
  badRequest,
  conflict,
  errorHandler,
  errorSchema,
  fail,
  forbidden,
  HttpError,
  notFound,
  notFoundHandler,
  objectIdSchema,
  ok,
  okSchema,
  paginated,
  paginatedSchema,
  paginationQuerySchema,
  parsePagination,
  unauthorized,
} from "../src/index.js";

test("envelopes preserve domain data and omit absent details", () => {
  const data = { success: false, data: { id: 1 } };
  expect(
    okSchema(
      z.object({ success: z.boolean(), data: z.object({ id: z.number() }) }),
    ).parse(ok(data)),
  ).toEqual(ok(data));
  expect(
    errorSchema.parse(fail("INVALID", "Invalid", { field: "name" })),
  ).toEqual(fail("INVALID", "Invalid", { field: "name" }));
  expect(fail("NO", "No").error).not.toHaveProperty("details");
  expect(fail("NO", "No", null).error).toHaveProperty("details", null);
  expect(objectIdSchema.safeParse("ABCDEF0123456789abcdef01").success).toBe(
    true,
  );
  expect(objectIdSchema.safeParse("not-an-id").success).toBe(false);
});

test("pagination validates queries and normalizes internal inputs without unsafe offsets", () => {
  expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  expect(paginationQuerySchema.parse({ page: "2", limit: "3" })).toEqual({
    page: 2,
    limit: 3,
  });
  for (const query of [
    { page: 0 },
    { limit: 101 },
    { page: "x" },
    { page: 1.5 },
  ]) {
    expect(paginationQuerySchema.safeParse(query).success).toBe(false);
  }
  expect(parsePagination({ page: -2, limit: 120 })).toEqual({
    page: 1,
    limit: 100,
    skip: 0,
  });
  expect(parsePagination({ page: Number.NaN, limit: Infinity })).toEqual({
    page: 1,
    limit: 20,
    skip: 0,
  });
  expect(parsePagination({ page: 2.9, limit: 2.9 })).toEqual({
    page: 2,
    limit: 2,
    skip: 2,
  });
  expect(
    Number.isSafeInteger(parsePagination({ page: Number.MAX_VALUE }).skip),
  ).toBe(true);
  expect(
    paginatedSchema(z.string()).parse(
      paginated(["a"], 3, { page: 2, limit: 2 }),
    ),
  ).toEqual({ items: ["a"], total: 3, page: 2, limit: 2, totalPages: 2 });
  expect(paginated([], 0, {}).totalPages).toBe(0);
});

test("HTTP factories have stable status codes", () => {
  for (const [error, status, code] of [
    [badRequest("bad", { field: "x" }), 400, "BAD_REQUEST"],
    [unauthorized(), 401, "UNAUTHORIZED"],
    [forbidden(), 403, "FORBIDDEN"],
    [notFound(), 404, "NOT_FOUND"],
    [conflict("exists"), 409, "CONFLICT"],
  ] as const) {
    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
  }
  expect(() => new HttpError(200, "INVALID", "Invalid")).toThrow(RangeError);
});

test("Fastify errors keep envelopes, redact internal failures, and log unexpected errors", async () => {
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const log = vi.spyOn(app.log, "error");
  app.post(
    "/validated",
    {
      schema: {
        body: z.object({ name: z.string().min(1) }),
        response: { 400: errorSchema },
      },
    },
    async () => ok(null),
  );
  app.get("/domain", async () => {
    throw conflict("Already exists", { id: "one" });
  });
  app.get("/zod", async () => z.string().parse(123));
  app.get("/internal", async () => {
    throw new Error("SECRET database URI");
  });
  app.get("/internal-http", async () => {
    throw new HttpError(503, "DB", "SECRET", { token: "SECRET" });
  });
  app.get("/limited", async () => {
    throw Object.assign(new Error("Slow down"), {
      statusCode: 429,
      code: "LIMIT",
    });
  });
  app.get("/invalid-status", async () => {
    throw Object.assign(new Error("SECRET"), { statusCode: 300 });
  });
  app.get(
    "/serialization",
    { schema: { response: { 200: okSchema(z.string()) } } },
    async () => ok(123),
  );
  try {
    expect((await app.inject("/domain")).json()).toEqual(
      fail("CONFLICT", "Already exists", { id: "one" }),
    );
    for (const url of [
      "/internal",
      "/internal-http",
      "/serialization",
      "/invalid-status",
    ]) {
      const response = await app.inject(url);
      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual(
        fail("INTERNAL_ERROR", "An unexpected error occurred"),
      );
    }
    for (const options of [
      { method: "POST" as const, url: "/validated", payload: { name: "" } },
      { method: "GET" as const, url: "/zod" },
    ]) {
      const response = await app.inject(options);
      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
    }
    const malformed = await app.inject({
      method: "POST",
      url: "/validated",
      headers: { "content-type": "application/json" },
      payload: "{",
    });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json().success).toBe(false);
    expect((await app.inject("/limited")).statusCode).toBe(429);
    const missing = await app.inject("/missing");
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error.code).toBe("NOT_FOUND");
    expect(log).toHaveBeenCalledTimes(4);
  } finally {
    await app.close();
  }
});
