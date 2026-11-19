import { useGet__Name__ } from '@/api/queries/useGet__Name__';
import { PageShell } from '@/components/PageShell';
import { QueryBoundary } from '@/components/QueryBoundary';
import { __Name__Content } from '../components/__Name__Content';
import { __Name__Header } from '../components/__Name__Header';

interface __Name__PageProps {
  id: string;
}

const __Name__Page = ({ id }: __Name__PageProps) => {
  const query = useGet__Name__(id);

  return (
    <PageShell>
      <QueryBoundary query={query}>
        {(__name__) => (
          <>
            <__Name__Header __name__={__name__} />
            <__Name__Content __name__={__name__} />
          </>
        )}
      </QueryBoundary>
    </PageShell>
  );
};

export { __Name__Page };
