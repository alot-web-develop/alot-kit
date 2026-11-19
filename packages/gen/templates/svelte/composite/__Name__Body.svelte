<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  let { children, class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>
<Box.Body class={cn('flex flex-col gap-4', className)} {...rest}>{@render children?.()}</Box.Body>
