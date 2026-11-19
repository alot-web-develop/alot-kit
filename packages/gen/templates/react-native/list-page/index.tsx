import { useLocalSearchParams, useRouter } from 'expo-router';
import { __Names__ListPage } from '@/features/__feature__/pages/__Names__ListPage';

const __Names__ListRoute = () => {
  const router = useRouter();
  const { search, page } = useLocalSearchParams<{ search?: string; page?: string }>();

  return (
    <__Names__ListPage
      search={search ?? ''}
      page={Number(page ?? 1)}
      onSearchChange={(next) => router.setParams({ search: next, page: '1' })}
      onPageChange={(nextPage) => router.setParams({ page: String(nextPage) })}
      onSelect={(id) => router.push(`/__feature__/${id}`)}
    />
  );
};

export default __Names__ListRoute;
