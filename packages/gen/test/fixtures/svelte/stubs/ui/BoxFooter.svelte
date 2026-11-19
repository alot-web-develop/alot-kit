<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from './lib';

  let { children, class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={cn('flex items-center justify-end gap-2 p-4', className)} {...rest}>{@render children?.()}</div>
