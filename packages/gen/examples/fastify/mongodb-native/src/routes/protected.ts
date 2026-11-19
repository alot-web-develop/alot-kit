import { protectedScope } from '@alot-web-develop/server';
import { orderRoutes } from './orders.js';
import { reportRoutes } from './report.js';
import { orderItemRoutes } from './order-items.js';

const protectedRoutes = protectedScope(async (_app) => {
  // alot-gen: protected routes
  await _app.register(orderRoutes, { prefix: '/orders' });
  await _app.register(reportRoutes, { prefix: '/report' });
  await _app.register(orderItemRoutes, { prefix: '/order-items' });
});

export { protectedRoutes };
