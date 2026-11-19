import { buildApp } from './app.js';
import { env } from './config/env.js';
import { authAdapter } from './lib/auth.js';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

const main = async () => {
  const app = await buildApp({ mongoUri: env.MONGODB_URI, auth: authAdapter });

  for (const signal of SHUTDOWN_SIGNALS) {
    process.once(signal, () => {
      app.log.info({ signal }, 'shutting down');
      app.close().then(
        () => process.exit(0),
        (error: unknown) => {
          app.log.error({ err: error }, 'shutdown failed');
          process.exit(1);
        },
      );
    });
  }

  await app.listen({ host: env.HOST, port: env.PORT });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
