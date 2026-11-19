import { createFileRoute } from '@tanstack/react-router';
import { __Name__Page } from '@/features/__feature__/pages/__Name__Page';

const __Name__Route = () => {
  const { __name__Id } = Route.useParams();

  return <__Name__Page id={__name__Id} />;
};

const Route = createFileRoute('/_app/__names-kebab__/$__name__Id')({ component: __Name__Route });

export { Route };
