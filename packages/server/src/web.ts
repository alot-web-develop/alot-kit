import { Readable } from "node:stream";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

/**
 * Converts Fastify's header shape (string, string[], or undefined per key)
 * into a standard Web {@link Headers} instance.
 */
const toWebHeaders = (headers: FastifyRequest["headers"]): Headers => {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      for (const item of Array.isArray(value) ? value : [String(value)]) {
        result.append(key, item);
      }
    }
  }
  return result;
};

/** Mount within a public scope at the provider's auth prefix. */
const webHandlerRoutes =
  (handler: (request: Request) => Promise<Response>): FastifyPluginAsync =>
  async (app) => {
    // Preserve the original bytes and let the provider parse its own protocol.
    // Fastify still enforces the application's bodyLimit before invoking us.
    app.removeAllContentTypeParsers();
    app.addContentTypeParser(
      "*",
      { parseAs: "buffer" },
      (_request, body, done) => done(null, body),
    );
    app.route({
      method: ["GET", "POST"],
      url: "/*",
      handler: async (request, reply) => {
        const url = new URL(
          request.url,
          `${request.protocol}://${request.host}`,
        );
        const response = await handler(
          new Request(url, {
            method: request.method,
            headers: toWebHeaders(request.headers),
            body:
              request.method === "POST" && Buffer.isBuffer(request.body)
                ? new Uint8Array(request.body)
                : undefined,
          }),
        );
        reply.status(response.status);
        response.headers.forEach((value, key) => {
          if (key !== "set-cookie") reply.header(key, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length > 0) reply.header("set-cookie", cookies);
        return reply.send(
          response.body ? Readable.fromWeb(response.body) : null,
        );
      },
    });
  };

export { toWebHeaders, webHandlerRoutes };
