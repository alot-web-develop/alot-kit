import type { FastifyPluginAsync } from "fastify";
import { fail, ok } from "./response.js";

type THealthCheck = () => Promise<unknown>;
type THealthOptions = {
  checks?: Record<string, THealthCheck>;
  version?: string;
  exposeErrors?: boolean;
};

/**
 * Runs a single readiness check, always resolving rather than rejecting.
 *
 * @param check - The async check to execute.
 * @returns `{ up: true }` on success, or `{ up: false, message }` on failure.
 */
const runCheck = async (check: THealthCheck) => {
  try {
    await check();
    return { up: true, message: "" };
  } catch (error) {
    return {
      up: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

/** Distills check results into a map of name to `up`/`down` status. */
const summarizeStatus = (
  entries: ReadonlyArray<readonly [string, { up: boolean; message: string }]>,
): Record<string, "up" | "down"> =>
  Object.fromEntries(
    entries.map(([name, result]) => [name, result.up ? "up" : "down"]),
  );

/** Collects error messages from failed checks, or `undefined` when hidden. */
const collectErrors = (
  entries: ReadonlyArray<readonly [string, { up: boolean; message: string }]>,
  exposeErrors: boolean,
): Record<string, string> | undefined => {
  if (!exposeErrors) return undefined;
  return Object.fromEntries(
    entries.map(([name, result]) => [name, result.message]),
  );
};

/**
 * Registers `/health/live` and `/health/ready` endpoints.
 *
 * `/health/live` reports liveness; `/health/ready` runs the supplied checks
 * and returns `503` when any is down, optionally exposing error messages.
 */
const healthRoutes: FastifyPluginAsync<THealthOptions> = async (
  app,
  { checks = {}, version, exposeErrors = false },
) => {
  const appVersion = version ?? process.env.npm_package_version ?? "0.0.0";

  app.get("/health/live", async () =>
    ok({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: appVersion,
    }),
  );

  app.get("/health/ready", async (_request, reply) => {
    const entries = await Promise.all(
      Object.entries(checks).map(
        async ([name, check]) => [name, await runCheck(check)] as const,
      ),
    );
    const status = summarizeStatus(entries);
    const allUp = entries.every(([, result]) => result.up);
    const timestamp = new Date().toISOString();

    if (allUp) {
      return ok({ status: "ok", checks: status, timestamp });
    }

    const errors = collectErrors(entries, exposeErrors);
    return reply.status(503).send(
      fail("NOT_READY", "Service not ready", {
        status: "degraded",
        checks: status,
        ...(errors === undefined ? {} : { errors }),
      }),
    );
  });
};

export type { THealthCheck, THealthOptions };
export { healthRoutes };
