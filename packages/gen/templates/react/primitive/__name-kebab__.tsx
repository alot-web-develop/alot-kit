import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

const __name__Variants = cva('inline-flex items-center rounded-md transition-colors', {
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

interface __Name__Props extends ComponentProps<'div'>, VariantProps<typeof __name__Variants> {}

const __Name__ = ({ variant, size, className, ...rest }: __Name__Props) => {
  return <div data-slot="__name-kebab__" className={cn(__name__Variants({ variant, size }), className)} {...rest} />;
};

export type { __Name__Props };
export { __Name__, __name__Variants };
