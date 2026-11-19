import { publicScope } from '@alot-web-develop/server';

const publicRoutes = publicScope(async (app) => {
  if (app.auth.routes) {
    await app.register(app.auth.routes, { prefix: '/auth' });
  }
});

export { publicRoutes };
