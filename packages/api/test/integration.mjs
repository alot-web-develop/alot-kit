import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const apiDir = fileURLToPath(new URL("..", import.meta.url));
const root = fileURLToPath(new URL("../../..", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "alot-api-consumer-"));
const consumer = join(scratch, "consumer");
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
};
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0 || result.error) {
    throw new Error(
      `${command} failed: ${result.error ?? ""}\n${result.stdout}\n${result.stderr}`,
    );
  }
};

// A real HTTP peer with the exact server fixture protocol. No server package,
// React, UI, TanStack, database, or external host is required.
const requests = [];
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);
  const body =
    rawBody.length &&
    request.headers["content-type"]?.includes("application/json")
      ? JSON.parse(rawBody.toString())
      : undefined;
  requests.push({
    method: request.method,
    url,
    headers: request.headers,
    body,
  });
  response.setHeader("content-type", "application/json");
  if (url.pathname === "/api/upload") {
    const multipartRequest = new Request(url, {
      method: "POST",
      headers: request.headers,
      body: rawBody,
    });
    const form = await multipartRequest.formData();
    const file = form.get("file");
    response.end(
      JSON.stringify({
        success: true,
        data: {
          name: file.name,
          text: await file.text(),
          active: form.get("active"),
        },
      }),
    );
  } else if (url.pathname === "/api/binary") {
    response.end(
      JSON.stringify({
        success: true,
        data: {
          hex: rawBody.toString("hex"),
          mime: request.headers["content-type"],
        },
      }),
    );
  } else if (url.pathname === "/api/missing") {
    response.writeHead(404);
    response.end(
      JSON.stringify({
        success: false,
        error: { code: "NOT_FOUND", message: "Order missing" },
      }),
    );
  } else if (url.pathname === "/api/unauthorized") {
    response.writeHead(401);
    response.end(
      JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Session expired" },
      }),
    );
  } else if (url.pathname === "/api/empty" || request.method === "DELETE") {
    response.writeHead(204);
    response.end();
  } else if (url.pathname === "/api/slow") {
    // Wait for the consumer to cancel; no timer or background server work.
    response.flushHeaders();
    response.write("{");
  } else {
    const item = {
      id: "one",
      name: body?.name ?? "Alice",
      createdAt: "2026-01-01",
    };
    const data =
      request.method === "GET" && url.pathname === "/api/orders"
        ? { items: [item], total: 1, page: 2, limit: 20, totalPages: 1 }
        : item;
    response.statusCode = request.method === "POST" ? 201 : 200;
    response.end(JSON.stringify({ success: true, data }));
  }
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  write(
    join(consumer, "package.json"),
    JSON.stringify({
      name: "alot-api-consumer",
      private: true,
      type: "module",
    }),
  );
  run("pnpm", ["pack", "--pack-destination", scratch], apiDir);
  run(
    "npm",
    [
      "install",
      join(scratch, "alot-web-develop-api-0.0.0.tgz"),
      "--offline",
      "--ignore-scripts",
      "--package-lock=false",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(scratch, "npm-cache"),
    ],
    consumer,
  );
  write(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noUncheckedIndexedAccess: true,
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        rootDir: "src",
        outDir: "dist",
        types: [],
      },
      include: ["src/**/*.ts"],
    }),
  );
  for (const framework of ["react", "react-native", "svelte"]) {
    const dest = join(consumer, "src", framework);
    const templates = join(root, "packages/gen/templates", framework);
    const expand = (file) =>
      readFileSync(file, "utf8")
        .replaceAll("__names-kebab__", "orders")
        .replaceAll("__Names__", "Orders")
        .replaceAll("__Name__", "Order")
        .replaceAll("__name__", "order")
        .replaceAll("@/api/client", "./client.js")
        .replaceAll("@/config/env", "./env.js")
        .replaceAll("@/lib/auth", "./auth.js")
        .replaceAll("@/types/main-api-types", "./domain.js");
    write(
      join(dest, "client.ts"),
      expand(join(templates, "api-client/client.ts")),
    );
    write(
      join(dest, "service.ts"),
      expand(join(templates, "service/__name__.ts")),
    );
    write(
      join(dest, "env.ts"),
      `export const env = { apiUrl: ${JSON.stringify(baseUrl)}, PUBLIC_API_URL: ${JSON.stringify(baseUrl)}, EXPO_PUBLIC_API_URL: ${JSON.stringify(baseUrl)} };`,
    );
    write(
      join(dest, "auth.ts"),
      `
      export const getToken = async () => null;
      export const getAuthHeaders = async () => ({ Cookie: 'session=native' });
      export const signOut = async () => {};
    `,
    );
    cpSync(
      join(root, "packages/gen/test/fixtures", framework, "stubs/api.ts"),
      join(dest, "fixture-contract.ts"),
    );
    // Compile real OpenAPI helper aliases as the service's domain types.
    write(
      join(dest, "domain.ts"),
      `
      import type { GetResponse, GetQuery, PostBody, PatchBody } from '@alot-web-develop/api';
      type Order = { id: string; name: string; createdAt: string };
      type Json<T> = { content: { 'application/json': T } };
      interface Paths {
        '/orders': {
          get: { parameters: { query?: { page?: number; limit?: number; search?: string } }; responses: { 200: Json<{ success: true; data: { items: Order[]; total: number; page: number; limit: number; totalPages: number } }> } };
          post: { requestBody: { content: { 'application/json': { name: string } } } };
        };
        '/orders/{id}': {
          get: { responses: { 200: Json<{ success: true; data: Order }> } };
          patch: { requestBody: { content: { 'application/json': { name?: string } } } };
        };
      }
      export type TOrder = GetResponse<Paths, '/orders/{id}'>;
      export type TOrderListResponse = GetResponse<Paths, '/orders'>;
      export type TOrderListQuery = GetQuery<Paths, '/orders'>;
      export type TCreateOrderRequest = PostBody<Paths, '/orders'>;
      export type TUpdateOrderRequest = PatchBody<Paths, '/orders/{id}'>;
    `,
    );
    write(
      join(dest, "compatibility.ts"),
      `
      import { createFetcher, unwrap, ApiError } from '@alot-web-develop/api';
      import type * as Fixture from './fixture-contract.js';
      const factory: typeof Fixture.createFetcher = createFetcher;
      const unwrapping: typeof Fixture.unwrap = unwrap;
      const error: InstanceType<typeof Fixture.ApiError> = new ApiError({ title: 'X', message: 'X' });
      void factory; void unwrapping; void error;
    `,
    );
  }
  run(
    join(root, "node_modules/.bin/tsc"),
    ["-p", join(consumer, "tsconfig.json")],
    root,
  );
  write(join(consumer, "entry.mjs"), "export * from '@alot-web-develop/api';");
  const { ApiError, createFetcher, unwrap } = await import(
    pathToFileURL(join(consumer, "entry.mjs"))
  );
  for (const framework of ["react", "react-native", "svelte"]) {
    const service = await import(
      pathToFileURL(join(consumer, "dist", framework, "service.js"))
    );
    const page = await unwrap(
      service.listOrders({ page: 2, search: "caffè & tea" }),
    );
    assert.equal(page.items[0].id, "one");
    assert.equal(page.page, 2);
    assert.equal(page.totalPages, 1);
    assert.equal(requests.at(-1).url.searchParams.get("search"), "caffè & tea");
    if (framework === "react-native")
      assert.equal(requests.at(-1).headers.cookie, "session=native");
    assert.equal((await unwrap(service.getOrder("one"))).id, "one");
    assert.equal(
      (await unwrap(service.createOrder({ name: "Created" }))).name,
      "Created",
    );
    assert.deepEqual(requests.at(-1).body, { name: "Created" });
    assert.equal(
      (await unwrap(service.updateOrder("one", { name: "Updated" }))).name,
      "Updated",
    );
    assert.equal(await unwrap(service.deleteOrder("one")), undefined);
  }
  const uploadApi = createFetcher({
    baseUrl,
    headers: { "content-type": "application/json" },
  });
  const form = new FormData();
  form.append(
    "file",
    new File(["upload bytes"], "test.txt", { type: "text/plain" }),
  );
  form.append("active", "false");
  assert.deepEqual(await unwrap(uploadApi.post("/upload", { body: form })), {
    name: "test.txt",
    text: "upload bytes",
    active: "false",
  });
  const binaryApi = createFetcher({ baseUrl });
  assert.deepEqual(
    await unwrap(
      binaryApi.put("/binary", {
        body: new Blob([new Uint8Array([0, 1, 255])], { type: "image/png" }),
      }),
    ),
    { hex: "0001ff", mime: "image/png" },
  );
  let unauthorized = 0;
  const api = createFetcher({
    baseUrl,
    getToken: async () => "token",
    onUnauthorized: async () => {
      unauthorized++;
    },
  });
  await assert.rejects(
    unwrap(api.get("/missing")),
    (error) =>
      error instanceof ApiError &&
      error.status === 404 &&
      error.title === "NOT_FOUND",
  );
  assert.equal(requests.at(-1).headers.authorization, "Bearer token");
  assert.equal((await api.get("/unauthorized")).errorDetails.status, 401);
  assert.equal(unauthorized, 1);
  assert.equal(await unwrap(api.get("/empty")), undefined);
  const controller = new AbortController();
  const received = once(server, "request");
  const pending = api.get("/slow", { signal: controller.signal });
  const rejection = assert.rejects(
    pending,
    (error) => error === controller.signal.reason,
  );
  await received;
  controller.abort();
  await rejection;
  console.log(
    "Verified packed API: strict TypeScript and real HTTP CRUD from React, React Native and Svelte templates; envelope pagination, native cookie, bearer, 401/404, 204 cancellation and real multipart/binary uploads.",
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  rmSync(scratch, { recursive: true, force: true });
}
