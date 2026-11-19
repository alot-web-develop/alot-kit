import Fastify from "fastify";
import { expect, expectTypeOf, test, vi } from "vitest";
import { z } from "zod";
import {
  baseEnvSchema,
  csvSchema,
  healthRoutes,
  loadEnv,
} from "../src/index.js";

test("environment defaults, extensions, coercion and CSV remain inferred", () => {
  const schema = baseEnvSchema.extend({
    SECRET: z.string().min(8),
    OPTIONAL: z.string().optional(),
  });
  const source = {
    SECRET: "secret-value",
    PORT: "8080",
    CORS_ORIGINS: "https://a.test, , https://b.test",
  };
  const env = loadEnv(schema, { source });
  expectTypeOf(env.PORT).toEqualTypeOf<number>();
  expectTypeOf(env.CORS_ORIGINS).toEqualTypeOf<string[]>();
  expect(env).toMatchObject({
    NODE_ENV: "development",
    HOST: "0.0.0.0",
    PORT: 8080,
    CORS_ORIGINS: ["https://a.test", "https://b.test"],
  });
  expect(source).not.toHaveProperty("NODE_ENV");
  expect(csvSchema.parse(undefined)).toEqual([]);
  expect(() =>
    loadEnv(schema, { source: { SECRET: "secret-value", PORT: "65536" } }),
  ).toThrow("PORT");
});

test("environment groups and production rules cannot be satisfied by missing or blank credentials", () => {
  const schema = baseEnvSchema.extend({
    ACCESS: z.string().optional(),
    SECRET: z.string().optional(),
  });
  expect(() =>
    loadEnv(schema, {
      groups: [["ACCESS", "SECRET"]],
      source: { ACCESS: "a", SECRET: " " },
    }),
  ).toThrow("must be set together");
  expect(
    loadEnv(schema, { groups: [["ACCESS", "SECRET"]], source: {} }),
  ).toBeDefined();
  expect(() =>
    loadEnv(schema, {
      requiredInProduction: ["CORS_ORIGINS"],
      source: { NODE_ENV: "production", CORS_ORIGINS: " " },
    }),
  ).toThrow("required in production: CORS_ORIGINS");
  expect(() =>
    loadEnv(schema, {
      requiredInProduction: ["CORS_ORIGINS"],
      source: { NODE_ENV: "production", CORS_ORIGINS: ", ," },
    }),
  ).toThrow("required in production: CORS_ORIGINS");
  expect(() =>
    loadEnv(schema, {
      requiredInProduction: ["SECRET"],
      source: { NODE_ENV: "test" },
    }),
  ).not.toThrow();
  // @ts-expect-error option keys must belong to the provided schema
  loadEnv(schema, { requiredInProduction: ["TYPO"], source: {} });
});

test("environment failures aggregate keys without logging source values or custom messages", () => {
  const schema = baseEnvSchema.extend({
    SECRET: z.string().refine(() => false, "secret-value leaked"),
    TOKEN: z.enum(["allowed"]),
  });
  try {
    loadEnv(schema, {
      source: { SECRET: "secret-value", TOKEN: "secret-token" },
    });
    expect.fail("must reject invalid env");
  } catch (error) {
    expect(String(error)).toContain("SECRET");
    expect(String(error)).toContain("TOKEN");
    expect(String(error)).not.toContain("secret-value");
    expect(String(error)).not.toContain("secret-token");
  }
});

test("health probes stay live through dependency failure and readiness recovers", async () => {
  const check = vi
    .fn()
    .mockRejectedValueOnce(new Error("secret database URI"))
    .mockResolvedValue(undefined);
  const app = Fastify();
  await app.register(healthRoutes, { version: "1.2.3", checks: { db: check } });
  try {
    const live = (await app.inject("/health/live")).json();
    expect(live.data).toMatchObject({ status: "ok", version: "1.2.3" });
    expect(check).not.toHaveBeenCalled();
    const down = await app.inject("/health/ready");
    expect(down.statusCode).toBe(503);
    expect(down.json().error.details).toEqual({
      status: "degraded",
      checks: { db: "down" },
    });
    expect(down.body).not.toContain("secret");
    const recovered = await app.inject("/health/ready");
    expect(recovered.statusCode).toBe(200);
    expect(recovered.json().data.checks).toEqual({ db: "up" });
  } finally {
    await app.close();
  }
});

test("health allows explicitly exposing diagnostics and has no required dependencies", async () => {
  for (const exposeErrors of [true, false]) {
    const app = Fastify();
    await app.register(healthRoutes, {
      exposeErrors,
      checks: {
        db: () => {
          throw new Error("offline");
        },
      },
    });
    try {
      expect(
        (await app.inject("/health/ready")).json().error.details.errors,
      ).toEqual(exposeErrors ? { db: "offline" } : undefined);
    } finally {
      await app.close();
    }
  }
  const app = Fastify();
  await app.register(healthRoutes);
  try {
    expect((await app.inject("/health/ready")).statusCode).toBe(200);
  } finally {
    await app.close();
  }
});
