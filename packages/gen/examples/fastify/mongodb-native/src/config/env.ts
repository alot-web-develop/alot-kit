import { baseEnvSchema, loadEnv } from '@alot-web-develop/server';
import { z } from 'zod';

const blankToUndefined = (value: unknown) => typeof value === 'string' && value.trim() === '' ? undefined : value;
const optionalString = z.preprocess(blankToUndefined, z.string().min(1).optional());

const envSchema = baseEnvSchema.extend({
  API_PREFIX: z.string().startsWith('/').default('/api'),
  MONGODB_URI: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  MOBILE_APP_SCHEME: z.preprocess(blankToUndefined, z.string().regex(/^[a-z][a-z0-9+.-]*$/).optional()),
  R2_ACCOUNT_ID: optionalString,
  R2_BUCKET: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_PUBLIC_URL: z.preprocess(blankToUndefined, z.url().optional()),
});

const env = loadEnv(envSchema, {
  groups: [['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']],
  requiredInProduction: ['CORS_ORIGINS'],
});

type TEnv = typeof env;

export { env };
export type { TEnv };
