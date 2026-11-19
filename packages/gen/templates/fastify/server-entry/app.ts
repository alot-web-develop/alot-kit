import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authPlugin, errorHandler, healthRoutes, notFoundHandler, type TAuthAdapter } from '@alot-web-develop/server';
import Fastify from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { dbPlugin } from './plugins/db.js';
import { protectedRoutes } from './routes/protected.js';
import { publicRoutes } from './routes/public.js';

type TAppDeps = { mongoUri: string; auth: TAuthAdapter };

const buildApp = async ({ mongoUri, auth }: TAppDeps) => {
  const app = Fastify({ logger: env.NODE_ENV === 'test' ? false : { level: env.LOG_LEVEL } });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.CORS_ORIGINS, credentials: true, methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    allowList: (request) => ['/health/live', '/health/ready'].includes(request.url.split('?')[0] ?? ''),
  });
  await app.register(swagger, {
    openapi: { info: { title: '__app-title__ API', version: '1.0.0' } },
    transform: jsonSchemaTransform,
  });
  if (env.NODE_ENV !== 'production') {
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  await app.register(dbPlugin, { uri: mongoUri });
  await app.register(authPlugin, { adapter: auth });
  await app.register(healthRoutes, {
    checks: { db: () => app.pingDb() },
    exposeErrors: env.NODE_ENV !== 'production',
  });
  await app.register(publicRoutes, { prefix: env.API_PREFIX });
  await app.register(protectedRoutes, { prefix: env.API_PREFIX });

  return app;
};

type TApp = Awaited<ReturnType<typeof buildApp>>;

export { buildApp };
export type { TApp, TAppDeps };
