<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from './lib';

  let { children, class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={cn('flex flex-col rounded-xl border border-border bg-surface-1 text-foreground', className)} {...rest}>{@render children?.()}</div>
