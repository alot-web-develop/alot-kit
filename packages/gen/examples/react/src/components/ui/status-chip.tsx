import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const statusChipVariants = cva('inline-flex items-center rounded-md transition-colors', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-border bg-transparent text-foreground hover:bg-surface-1',
    },
    size: {
      default: 'h-9 px-4 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-6 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface StatusChipProps extends ComponentProps<'div'>, VariantProps<typeof statusChipVariants> {}

const StatusChip = ({ variant, size, className, ...rest }: StatusChipProps) => {
  return <div data-slot="status-chip" className={cn(statusChipVariants({ variant, size }), className)} {...rest} />;
};

export { StatusChip, statusChipVariants };
export type { StatusChipProps };
