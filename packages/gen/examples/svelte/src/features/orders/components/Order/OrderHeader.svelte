<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  let { children, class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>
<Box.Header class={cn('flex items-center justify-between', className)} {...rest}>{@render children?.()}</Box.Header>
