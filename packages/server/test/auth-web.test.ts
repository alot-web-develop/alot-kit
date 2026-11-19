import Fastify, { type FastifyRequest } from "fastify";
import { expect, test, vi } from "vitest";
import {
  authPlugin,
  currentUser,
  errorHandler,
  ok,
  protectedScope,
  publicScope,
  requireRole,
  toWebHeaders,
  webHandlerRoutes,
} from "../src/index.js";

const alice = { id: "alice", email: "alice@example.test", role: "user" };
const admin = { id: "root", email: "admin@example.test", role: "admin" };

test("scopes authenticate via adapter, enforce roles, isolate requests and close adapter once", async () => {
  const adapter = {
    closed: false,
    async close() {
      this.closed = true;
    },
    getUser: vi.fn(async (request: FastifyRequest) => {
      const token = request.headers.cookie ?? request.headers.authorization;
      return token === "session=alice"
        ? alice
        : token === "Bearer admin"
          ? admin
          : null;
    }),
  };
  const close = vi.spyOn(adapter, "close");
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  await app.register(authPlugin, { adapter });
  await app.register(
    protectedScope(async (scope) => {
      scope.get("/who", async (request) => ok(currentUser(request)));
      scope.get(
        "/admin",
        { preHandler: requireRole("admin", "owner") },
        async () => ok(null),
      );
      scope.get("/deny", { preHandler: requireRole() }, async () => ok(null));
    }),
    { prefix: "/private" },
  );
  await app.register(
    publicScope(async (scope) => {
      scope.get("/public", async (request) => ({ user: request.user }));
      scope.get("/current", async (request) => currentUser(request));
      scope.get("/role", { preHandler: requireRole("admin") }, async () =>
        ok(null),
      );
    }),
  );
  try {
    const responses = await Promise.all([
      app.inject({
        url: "/private/who",
        headers: { cookie: "session=alice", "x-role": "admin" },
      }),
      app.inject({
        url: "/private/who",
        headers: { authorization: "Bearer admin" },
      }),
      app.inject({
        url: "/private/who",
        headers: { authorization: "Bearer expired" },
      }),
    ]);
    expect(responses.map((r) => r.statusCode)).toEqual([200, 200, 401]);
    expect(responses[0].json().data).toEqual(alice);
    expect(responses[1].json().data).toEqual(admin);
    expect(
      (
        await app.inject({
          url: "/private/admin",
          headers: { cookie: "session=alice" },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          url: "/private/admin",
          headers: { authorization: "Bearer admin" },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          url: "/private/deny",
          headers: { authorization: "Bearer admin" },
        })
      ).statusCode,
    ).toBe(403);
    expect((await app.inject("/current")).statusCode).toBe(401);
    expect((await app.inject("/role")).statusCode).toBe(401);
    const calls = adapter.getUser.mock.calls.length;
    expect((await app.inject("/public")).json()).toEqual({ user: null });
    expect(adapter.getUser).toHaveBeenCalledTimes(calls);
  } finally {
    await app.close();
  }
  expect(close).toHaveBeenCalledTimes(1);
  expect(adapter.closed).toBe(true);
});

test("adapter failure stays an internal error without accepting identity headers", async () => {
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  await app.register(authPlugin, {
    adapter: {
      getUser: async () => {
        throw new Error("SECRET");
      },
    },
  });
  await app.register(
    protectedScope(async (scope) => {
      scope.get("/private", async () => ok(null));
    }),
  );
  try {
    const response = await app.inject({
      url: "/private",
      headers: { "x-user-id": "admin", "x-role": "admin" },
    });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("SECRET");
  } finally {
    await app.close();
  }
});

test("Web bridge preserves raw bodies, query, status, binary bytes and separate cookies", async () => {
  const seen: Request[] = [];
  const app = Fastify({ bodyLimit: 64 });
  app.setErrorHandler(errorHandler);
  await app.register(
    webHandlerRoutes(async (request) => {
      seen.push(request);
      if (request.method === "POST") {
        const body = await request.text();
        return Response.json(
          { body, url: request.url, type: request.headers.get("content-type") },
          { status: 202 },
        );
      }
      if (request.url.includes("empty"))
        return new Response(null, { status: 204 });
      const headers = new Headers({
        "content-type": "application/octet-stream",
        "x-provider": "generic",
      });
      headers.append("set-cookie", "one=1; Path=/; HttpOnly");
      headers.append("set-cookie", "two=2; Path=/; HttpOnly");
      return new Response(new Uint8Array([0, 255, 42]), {
        status: 201,
        headers,
      });
    }),
    { prefix: "/auth" },
  );
  app.post("/json", async (request) => request.body);
  try {
    for (const [type, payload] of [
      ["application/json", '{ "value": 1 }'],
      ["application/x-www-form-urlencoded", "x=1&y=two"],
      ["text/plain", "plain"],
    ]) {
      const response = await app.inject({
        method: "POST",
        url: "/auth/sign-in?next=a",
        headers: { "content-type": type, host: "localhost:4000" },
        payload,
      });
      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({
        body: payload,
        type,
        url: "http://localhost:4000/auth/sign-in?next=a",
      });
    }
    const response = await app.inject("/auth/session");
    expect(response.statusCode).toBe(201);
    expect([...response.rawPayload]).toEqual([0, 255, 42]);
    expect(response.headers["set-cookie"]).toEqual([
      "one=1; Path=/; HttpOnly",
      "two=2; Path=/; HttpOnly",
    ]);
    expect(response.headers["x-provider"]).toBe("generic");
    expect((await app.inject("/auth/empty")).body).toBe("");
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/json",
          payload: { value: 1 },
        })
      ).json(),
    ).toEqual({ value: 1 });
    const calls = seen.length;
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/auth/big",
          headers: { "content-type": "text/plain" },
          payload: "x".repeat(65),
        })
      ).statusCode,
    ).toBe(413);
    expect(seen).toHaveLength(calls);
  } finally {
    await app.close();
  }
  const headers = toWebHeaders({
    cookie: "a=1",
    "x-list": ["one", "two"],
    missing: undefined,
  });
  expect(headers.get("cookie")).toBe("a=1");
  expect(headers.get("x-list")).toBe("one, two");
  expect(headers.has("missing")).toBe(false);
});
