import { useLocalSearchParams } from 'expo-router';
import { __Name__Page } from '@/features/__feature__/pages/__Name__Page';

const __Name__Route = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <__Name__Page id={id} />;
};

export default __Name__Route;
