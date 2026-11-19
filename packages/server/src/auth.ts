import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import { forbidden, unauthorized } from "./errors.js";

type TAuthUser = { id: string; email: string; role: string };
type TAuthAdapter = {
  getUser: (request: FastifyRequest) => Promise<TAuthUser | null>;
  routes?: FastifyPluginAsync;
  close?: () => Promise<void>;
};

declare module "fastify" {
  interface FastifyInstance {
    auth: TAuthAdapter;
  }
  interface FastifyRequest {
    user: TAuthUser | null;
  }
}

const authPlugin = fp<{ adapter: TAuthAdapter }>(
  async (app, { adapter }) => {
    app.decorate("auth", adapter);
    app.decorateRequest("user", null);
    if (adapter.close)
      app.addHook("onClose", async () => {
        await adapter.close?.();
      });
  },
  { name: "@alot-web-develop/server/auth", fastify: "5.x" },
);

/**
 * Resolves the current user via the configured auth adapter, rejecting with a
 * `401` when no valid session is found. Attaches the result to `request.user`.
 */
const requireAuth = async (request: FastifyRequest) => {
  request.user = null;
  const user = await request.server.auth.getUser(request);
  if (!user) throw unauthorized("Invalid or expired session");
  request.user = user;
};

/**
 * Returns a guard that rejects with `401`/`403` unless the current user holds
 * one of the allowed roles. Must run after {@link requireAuth}.
 */
const requireRole =
  (...roles: string[]) =>
  async (request: FastifyRequest) => {
    if (!request.user) throw unauthorized();
    if (!roles.includes(request.user.role)) throw forbidden();
  };

/** Returns the authenticated user, throwing a `401` when it is absent. */
const currentUser = (request: FastifyRequest): TAuthUser => {
  if (!request.user) throw unauthorized();
  return request.user;
};

type TScopeRoutes = (app: FastifyInstance) => Promise<void>;

/**
 * Wraps a route group so it runs without authentication. Provided for
 * explicitness when composing scopes.
 */
const publicScope =
  (routes: TScopeRoutes): FastifyPluginAsync =>
  async (app) => {
    await routes(app);
  };

/**
 * Wraps a route group behind {@link requireAuth}, applying the auth guard to
 * every request within the scope.
 */
const protectedScope =
  (routes: TScopeRoutes): FastifyPluginAsync =>
  async (app) => {
    app.addHook("onRequest", requireAuth);
    await routes(app);
  };

export type { TAuthAdapter, TAuthUser, TScopeRoutes };
export {
  authPlugin,
  currentUser,
  protectedScope,
  publicScope,
  requireAuth,
  requireRole,
};
