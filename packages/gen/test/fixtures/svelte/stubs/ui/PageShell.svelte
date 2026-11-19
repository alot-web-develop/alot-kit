<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from './lib';

  let { children, class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={cn('flex flex-col gap-4', className)} {...rest}>{@render children?.()}</div>
