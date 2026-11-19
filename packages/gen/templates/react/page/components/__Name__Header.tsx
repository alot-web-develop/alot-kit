import type { T__Name__ } from '@/types/main-api-types';

interface __Name__HeaderProps {
  __name__: T__Name__;
}

const __Name__Header = ({ __name__ }: __Name__HeaderProps) => {
  return (
    <header>
      <h1 className="text-xl font-semibold text-foreground">{__name__.name}</h1>
    </header>
  );
};

export { __Name__Header };
