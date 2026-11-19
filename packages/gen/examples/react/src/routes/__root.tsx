import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

interface RouterContext {
  queryClient: QueryClient;
}

const RootRoute = () => <Outlet />;

const Route = createRootRouteWithContext<RouterContext>()({ component: RootRoute });

export { Route };
