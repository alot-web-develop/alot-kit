<script lang="ts" module>
  import { cva, type VariantProps } from 'class-variance-authority';
  const __name__Variants = cva('inline-flex items-center rounded-md transition-colors', {
    variants: {
      variant: { default: 'bg-primary text-primary-foreground hover:bg-primary/90', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', outline: 'border border-border bg-transparent text-foreground hover:bg-surface-1' },
      size: { default: 'h-9 px-4 text-sm', sm: 'h-8 px-3 text-xs', lg: 'h-10 px-6 text-base' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  });
  type __Name__Props = HTMLAttributes<HTMLDivElement> & VariantProps<typeof __name__Variants>;
  import type { HTMLAttributes } from 'svelte/elements';

  export { __name__Variants };
  export type { __Name__Props };
</script>
<script lang="ts">
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  let { variant, size, class: className, children, ...rest }: __Name__Props = $props();
</script>
<div data-slot="__name-kebab__" class={cn(__name__Variants({ variant, size }), className)} {...rest}>{@render children?.()}</div>
