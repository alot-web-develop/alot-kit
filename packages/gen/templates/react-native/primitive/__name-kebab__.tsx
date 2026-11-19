import { cva, type VariantProps } from 'class-variance-authority';
import { View, type ViewProps } from 'react-native';
import { cn } from '../lib/cn';

const __name__Variants = cva('flex-row items-center rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
      outline: 'border border-border bg-transparent',
    },
    size: {
      default: 'h-9 px-4',
      sm: 'h-8 px-3',
      lg: 'h-10 px-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface __Name__Props extends ViewProps, VariantProps<typeof __name__Variants> {}

const __Name__ = ({ variant, size, className, ...rest }: __Name__Props) => {
  return <View className={cn(__name__Variants({ variant, size }), className)} {...rest} />;
};

export { __Name__, __name__Variants };
export type { __Name__Props };
