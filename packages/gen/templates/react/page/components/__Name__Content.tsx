import { Card, CardContent } from '@alot-web-develop/ui/card';
import type { T__Name__ } from '@/types/main-api-types';

interface __Name__ContentProps {
  __name__: T__Name__;
}

const __Name__Content = ({ __name__ }: __Name__ContentProps) => {
  return (
    <Card>
      <CardContent>{__name__.name}</CardContent>
    </Card>
  );
};

export { __Name__Content };
