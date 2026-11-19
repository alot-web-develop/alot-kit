<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  let { children, class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>
<Box.Footer class={cn('flex justify-end gap-2', className)} {...rest}>{@render children?.()}</Box.Footer>
