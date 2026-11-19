<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { TOrder } from '@/types/main-api-types';

  let { order }: { order: TOrder } = $props();
</script>

<Box.Body class="rounded-md border border-border bg-surface-1 p-4 text-foreground">{order.name}</Box.Body>
