import { afterEach, describe, expect, test, vi } from "vitest";
import type { FetcherConfig } from "../src/index.js";
import { ApiError, createFetcher, unwrap } from "../src/index.js";

const baseUrl = "https://example.test/api";
const json = (body: unknown, init?: ResponseInit) => Response.json(body, init);
const mockFetch = (response: Response) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

afterEach(() => vi.restoreAllMocks());

describe("request construction", () => {
  test.each(["get", "post", "put", "patch", "delete"] as const)(
    "%s sends the correct method, JSON body and signal",
    async (method) => {
      const fetch = mockFetch(json({ id: "one" }));
      const signal = new AbortController().signal;
      const body = method === "get" ? undefined : { name: "Alice" };
      const api = createFetcher({ baseUrl });
      expect(await unwrap(api[method]("/orders", { body, signal }))).toEqual({
        id: "one",
      });
      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0];
      expect(String(url)).toBe(`${baseUrl}/orders`);
      expect(init).toMatchObject({
        method: method.toUpperCase(),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
      expect(new Headers(init?.headers).get("content-type")).toBe(
        method === "get" ? null : "application/json",
      );
      expect(new Headers(init?.headers).get("accept")).toBe("application/json");
      expect(init).not.toHaveProperty("credentials");
    },
  );

  test.each(["/orders", "orders"])(
    "joins %s without dropping the API prefix",
    async (path) => {
      const fetch = mockFetch(json(null));
      await createFetcher({ baseUrl: `${baseUrl}///` }).get(path);
      expect(String(fetch.mock.calls[0][0])).toBe(`${baseUrl}/orders`);
    },
  );

  test("merges URL query and encodes scalars and repeated arrays before the hash", async () => {
    const fetch = mockFetch(json(null));
    const api = createFetcher({ baseUrl: `${baseUrl}?tenant=one&page=0` });
    await api.get("/orders?page=1&keep=yes#list", {
      query: {
        page: 2,
        search: "caffè & tea+milk/",
        active: false,
        limit: 0,
        tags: ["a b", "c&d", null, undefined],
        unset: undefined,
        empty: null,
      },
    });
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/orders");
    expect(url.searchParams.get("tenant")).toBe("one");
    expect(url.searchParams.getAll("page")).toEqual(["2"]);
    expect(url.searchParams.get("search")).toBe("caffè & tea+milk/");
    expect(url.searchParams.get("active")).toBe("false");
    expect(url.searchParams.get("limit")).toBe("0");
    expect(url.searchParams.get("keep")).toBe("yes");
    expect(url.searchParams.getAll("tags")).toEqual(["a b", "c&d"]);
    expect(url.searchParams.has("unset")).toBe(false);
    expect(url.searchParams.has("empty")).toBe(false);
    expect(url.hash).toBe("#list");
  });

  test("rejects nested query objects instead of sending [object Object]", async () => {
    const fetch = mockFetch(json(null));
    await expect(
      createFetcher({ baseUrl }).get("/orders", { query: { filter: {} } }),
    ).rejects.toThrow(TypeError);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("refreshes asynchronous native headers and token per request", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => json(null));
    const headers = vi
      .fn()
      .mockResolvedValueOnce({ Cookie: "session=one", Authorization: "old" })
      .mockResolvedValueOnce({ Cookie: "session=two" });
    const getToken = vi
      .fn()
      .mockResolvedValueOnce("fresh")
      .mockResolvedValueOnce(null);
    const api = createFetcher({
      baseUrl,
      headers,
      getToken,
      credentials: "omit",
    });
    await api.get("/orders");
    await api.get("/orders");
    const first = new Headers(fetch.mock.calls[0][1]?.headers);
    const second = new Headers(fetch.mock.calls[1][1]?.headers);
    expect(first.get("cookie")).toBe("session=one");
    expect(first.get("authorization")).toBe("Bearer fresh");
    expect(second.get("cookie")).toBe("session=two");
    expect(second.has("authorization")).toBe(false);
    expect(
      fetch.mock.calls.every(([, init]) => init?.credentials === "omit"),
    ).toBe(true);
    expect(headers).toHaveBeenCalledTimes(2);
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  test.each<FetcherConfig["headers"]>([
    { "X-App": "kit" },
    () => ({ "X-App": "kit" }),
    new Headers({ "X-App": "kit" }),
    [["X-App", "kit"]],
  ])("accepts standard and synchronous headers", async (headers) => {
    const fetch = mockFetch(json(null));
    await createFetcher({ baseUrl, headers, credentials: "include" }).get("/");
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get("x-app")).toBe(
      "kit",
    );
    expect(fetch.mock.calls[0][1]?.credentials).toBe("include");
  });

  test("keeps caller headers intact, including authorization without a token", async () => {
    const fetch = mockFetch(json(null));
    const headers = new Headers({
      authorization: "Basic abc",
      "Content-Type": "application/merge-patch+json",
      accept: "application/problem+json",
    });
    await createFetcher({ baseUrl, headers, getToken: () => null }).patch(
      "/one",
      { body: null },
    );
    expect(fetch.mock.calls[0][1]?.body).toBe("null");
    expect(new Headers(fetch.mock.calls[0][1]?.headers)).toEqual(headers);
    expect([...headers.keys()]).toHaveLength(3);
  });
});

describe("response normalization", () => {
  test.each([null, false, 0, "hello", [1, 2], { id: "one" }])(
    "preserves direct JSON %j",
    async (payload) => {
      mockFetch(json(payload));
      expect(await unwrap(createFetcher({ baseUrl }).get("/"))).toEqual(
        payload,
      );
    },
  );

  test("unwraps exactly one server envelope and retains pagination", async () => {
    const data = {
      items: [{ id: "one" }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    mockFetch(json({ success: true, data }));
    expect(await unwrap(createFetcher({ baseUrl }).get("/orders"))).toEqual(
      data,
    );
  });

  test("does not recursively unwrap domain objects", async () => {
    const data = { success: true, data: "domain" };
    mockFetch(json({ success: true, data }));
    expect(await unwrap(createFetcher({ baseUrl }).get("/"))).toEqual(data);
  });

  const collisions = [
    { success: true, data: 1, id: "domain" },
    { success: true },
    { success: "true", data: 1 },
    { success: false, error: "domain" },
    { success: false, error: { code: 4, message: "bad" } },
    { success: false, error: { code: "X", message: "domain", extra: 1 } },
    { success: false, error: { code: "X", message: "domain" }, extra: 1 },
  ];
  test.each(collisions)(
    "auto keeps non-envelope payload %j intact",
    async (payload) => {
      mockFetch(json(payload));
      expect(await unwrap(createFetcher({ baseUrl }).get("/"))).toEqual(
        payload,
      );
    },
  );

  test.each([
    { success: true, data: "domain" },
    { success: false, error: { code: "DOMAIN", message: "domain" } },
  ])("json mode preserves exact collisions %j", async (payload) => {
    mockFetch(json(payload));
    expect(
      await unwrap(createFetcher({ baseUrl, responseMode: "json" }).get("/")),
    ).toEqual(payload);
  });

  test.each([...collisions, { id: "raw" }, null])(
    "envelope mode rejects malformed or raw payload %j",
    async (payload) => {
      mockFetch(json(payload));
      expect(
        await createFetcher({ baseUrl, responseMode: "envelope" }).get("/"),
      ).toMatchObject({
        error: true,
        data: null,
        errorDetails: { title: "Invalid response", status: 200 },
      });
    },
  );

  test.each([200, 204, 205])(
    "accepts empty %s bodies as undefined",
    async (status) => {
      mockFetch(new Response(null, { status }));
      expect(
        await createFetcher({ baseUrl, responseMode: "envelope" }).delete<void>(
          "/one",
        ),
      ).toEqual({
        error: false,
        data: undefined,
        errorDetails: null,
      });
    },
  );

  test.each(["not JSON", "{broken", "   "])(
    "rejects invalid JSON success %j",
    async (text) => {
      mockFetch(new Response(text));
      expect(await createFetcher({ baseUrl }).get("/")).toEqual({
        error: true,
        data: null,
        errorDetails: {
          title: "Invalid response",
          message: "Expected a JSON response",
          status: 200,
        },
      });
    },
  );
});

describe("failures and cancellation", () => {
  test.each([200, 400, 401, 404, 409, 500])(
    "normalizes a server failure at HTTP %s",
    async (status) => {
      mockFetch(
        json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Order missing",
              details: null,
            },
          },
          { status },
        ),
      );
      expect(await createFetcher({ baseUrl }).get("/missing")).toEqual({
        error: true,
        data: null,
        errorDetails: {
          title: "NOT_FOUND",
          message: "Order missing",
          status,
          details: null,
        },
      });
    },
  );

  test.each([200, 422])(
    "retains server validation issues through unwrap at HTTP %s",
    async (status) => {
      const details = {
        context: "body",
        issues: [{ instancePath: "/ingredients/0/name", message: "Required" }],
      };
      mockFetch(
        json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid recipe",
              details,
            },
          },
          { status },
        ),
      );
      const promise = unwrap(
        createFetcher({ baseUrl }).post("/recipes", { body: {} }),
      );
      await expect(promise).rejects.toBeInstanceOf(ApiError);
      await expect(promise).rejects.toMatchObject({
        status,
        errorDetails: { title: "VALIDATION_ERROR", details },
      });
    },
  );

  test("retains direct error metadata without trusting a payload status", async () => {
    const details = ["invalid input"];
    mockFetch(
      json(
        {
          title: "Validation",
          message: "Invalid recipe",
          status: 200,
          details,
        },
        { status: 400 },
      ),
    );
    expect(await createFetcher({ baseUrl }).post("/recipes")).toEqual({
      error: true,
      data: null,
      errorDetails: {
        title: "Validation",
        message: "Invalid recipe",
        status: 400,
        details,
      },
    });
  });

  test.each(["auto", "json", "envelope"] as const)(
    "HTTP status takes priority in %s mode",
    async (responseMode) => {
      mockFetch(json({ success: true, data: { id: "one" } }, { status: 500 }));
      expect(
        await createFetcher({ baseUrl, responseMode }).get("/"),
      ).toMatchObject({ error: true, errorDetails: { status: 500 } });
    },
  );

  test.each([
    [
      json(
        { title: "Invalid", message: "Bad input", status: 999 },
        { status: 422 },
      ),
      "Invalid",
      "Bad input",
    ],
    [
      json({ title: "Invalid", detail: "Bad input" }, { status: 422 }),
      "Invalid",
      "Bad input",
    ],
    [
      new Response("upstream down", { status: 502, statusText: "Bad Gateway" }),
      "Bad Gateway",
      "upstream down",
    ],
    [new Response(null, { status: 502 }), "HTTP 502", "HTTP 502"],
    [
      json(
        { error: { message: "malformed" }, success: false },
        { status: 502 },
      ),
      "HTTP 502",
      "HTTP 502",
    ],
  ])(
    "retains HTTP errors and useful fallback messages",
    async (response, title, message) => {
      mockFetch(response as Response);
      expect(await createFetcher({ baseUrl }).get("/")).toEqual({
        error: true,
        data: null,
        errorDetails: { title, message, status: (response as Response).status },
      });
    },
  );

  test("awaits unauthorized callback once, including on an empty 401", async () => {
    mockFetch(new Response(null, { status: 401 }));
    let finished = false;
    const onUnauthorized = vi.fn(async () => {
      await Promise.resolve();
      finished = true;
    });
    const result = await createFetcher({ baseUrl, onUnauthorized }).get("/");
    expect(result).toMatchObject({
      error: true,
      errorDetails: { status: 401 },
    });
    expect(finished).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test("does not sign out on 403 or successful responses", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(json(null));
    const onUnauthorized = vi.fn();
    const api = createFetcher({ baseUrl, onUnauthorized });
    await api.get("/");
    await api.get("/");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  test("network failures return a failure without an invented HTTP status", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    expect(await createFetcher({ baseUrl }).get("/")).toEqual({
      error: true,
      data: null,
      errorDetails: { title: "Network error", message: "offline" },
    });
  });

  test("body stream failures retain the received HTTP status", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error("stream interrupted"));
      },
    });
    mockFetch(new Response(stream, { status: 503 }));
    expect(await createFetcher({ baseUrl }).get("/")).toMatchObject({
      error: true,
      errorDetails: {
        status: 503,
        title: "Response error",
        message: "stream interrupted",
      },
    });
  });

  test("pre-aborted requests reject with their original reason before auth/fetch", async () => {
    const fetch = mockFetch(json(null));
    const headers = vi.fn();
    const reason = { cancelled: true };
    const signal = AbortSignal.abort(reason);
    await expect(
      createFetcher({ baseUrl, headers }).get("/", { signal }),
    ).rejects.toBe(reason);
    expect(headers).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("rechecks cancellation after asynchronous auth", async () => {
    const fetch = mockFetch(json(null));
    const controller = new AbortController();
    const api = createFetcher({
      baseUrl,
      getToken: async () => {
        controller.abort();
        return "token";
      },
    });
    await expect(api.get("/", { signal: controller.signal })).rejects.toBe(
      controller.signal.reason,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test("cancellation during fetch rejects without becoming ApiError", async () => {
    const controller = new AbortController();
    const reason = new Error("cancelled");
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      controller.abort(reason);
      throw reason;
    });
    await expect(
      unwrap(
        createFetcher({ baseUrl }).get("/", { signal: controller.signal }),
      ),
    ).rejects.toBe(reason);
  });

  test("cancellation while reading a body preserves the original reason", async () => {
    const controller = new AbortController();
    const reason = new DOMException("cancelled", "AbortError");
    const stream = new ReadableStream({
      pull(streamController) {
        controller.abort(reason);
        streamController.error(reason);
      },
    });
    mockFetch(new Response(stream));
    await expect(
      createFetcher({ baseUrl }).get("/", { signal: controller.signal }),
    ).rejects.toBe(reason);
  });

  test("configuration and hook errors reject unchanged", async () => {
    expect(() => createFetcher({ baseUrl: "/api" })).toThrow(TypeError);
    expect(() => createFetcher({ baseUrl: "ftp://example.test" })).toThrow(
      TypeError,
    );
    const failure = new Error("application hook failed");
    const api = createFetcher({
      baseUrl,
      headers: async () => {
        throw failure;
      },
    });
    await expect(api.get("/")).rejects.toBe(failure);
    mockFetch(new Response(null, { status: 401 }));
    await expect(
      createFetcher({
        baseUrl,
        onUnauthorized: () => {
          throw failure;
        },
      }).get("/"),
    ).rejects.toBe(failure);
    await expect(
      createFetcher({ baseUrl }).post("/", { body: 1n }),
    ).rejects.toThrow(TypeError);
  });

  test("unwrap throws ApiError with the details used by query retry/toast consumers", async () => {
    mockFetch(
      json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Order missing" },
        },
        { status: 404 },
      ),
    );
    const promise = unwrap(createFetcher({ baseUrl }).get("/missing"));
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      name: "ApiError",
      title: "NOT_FOUND",
      message: "Order missing",
      status: 404,
      errorDetails: {
        title: "NOT_FOUND",
        message: "Order missing",
        status: 404,
      },
    });
  });
});

describe("upload request bodies", () => {
  test("FormData bypasses JSON serialization and removes configured Content-Type without mutating headers", async () => {
    const fetch = mockFetch(json({ uploaded: true }));
    const headers = { "content-type": "application/json", "x-project": "alot" };
    const body = new FormData();
    body.append(
      "avatar",
      new File(["image"], "avatar.png", { type: "image/png" }),
    );
    body.append("active", "false");
    await createFetcher({ baseUrl, headers }).post("/upload", { body });
    const init = fetch.mock.calls[0][1];
    expect(init?.body).toBe(body);
    expect(new Headers(init?.headers).has("content-type")).toBe(false);
    expect(new Headers(init?.headers).get("x-project")).toBe("alot");
    expect(headers["content-type"]).toBe("application/json");
  });
  test.each([
    new Blob(["bytes"], { type: "image/png" }),
    new URLSearchParams({ name: "Ada" }),
    new ArrayBuffer(2),
    new Uint8Array([0, 1]),
  ])("passes native body unchanged: %s", async (body) => {
    const fetch = mockFetch(new Response(null, { status: 204 }));
    await createFetcher({ baseUrl }).put("/upload", { body });
    expect(fetch.mock.calls[0][1]?.body).toBe(body);
    expect(
      new Headers(fetch.mock.calls[0][1]?.headers).has("content-type"),
    ).toBe(false);
  });
  test("binary upload preserves an explicit MIME type", async () => {
    const fetch = mockFetch(new Response(null, { status: 204 }));
    await createFetcher({
      baseUrl,
      headers: { "content-type": "image/jpeg" },
    }).put("/upload", { body: new Blob(["jpeg"]) });
    expect(
      new Headers(fetch.mock.calls[0][1]?.headers).get("content-type"),
    ).toBe("image/jpeg");
  });
});
