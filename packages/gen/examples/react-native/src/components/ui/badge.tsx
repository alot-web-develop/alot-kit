import { cva, type VariantProps } from 'class-variance-authority';
import { View, type ViewProps } from 'react-native';
import { cn } from '../lib/cn';

const badgeVariants = cva('flex-row items-center rounded-md', {
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

interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {}

const Badge = ({ variant, size, className, ...rest }: BadgeProps) => {
  return <View className={cn(badgeVariants({ variant, size }), className)} {...rest} />;
};

export { Badge, badgeVariants };
export type { BadgeProps };
