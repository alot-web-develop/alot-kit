import { type TAuthAdapter, toWebHeaders, webHandlerRoutes } from '@alot-web-develop/server';
import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { bearer } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

const client = new MongoClient(env.MONGODB_URI);

const EXPO_DEV_ORIGINS = ['exp://', 'exp://**'];

const mobileOrigins = env.MOBILE_APP_SCHEME
  ? [`${env.MOBILE_APP_SCHEME}://`, ...(env.NODE_ENV === 'development' ? EXPO_DEV_ORIGINS : [])]
  : [];

const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: `${env.API_PREFIX}/auth`,
  trustedOrigins: [...env.CORS_ORIGINS, ...mobileOrigins],
  emailAndPassword: { enabled: true },
  advanced: { disableOriginCheck: false },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
    },
  },
  plugins: env.MOBILE_APP_SCHEME ? [bearer(), expo()] : [bearer()],
});

const authAdapter: TAuthAdapter = {
  getUser: async (request) => {
    const session = await auth.api.getSession({ headers: toWebHeaders(request.headers) });
    if (!session) return null;
    const { id, email, role } = session.user;
    return { id, email, role: role ?? 'user' };
  },
  routes: webHandlerRoutes(auth.handler),
  close: () => client.close(),
};

export { auth, authAdapter };
