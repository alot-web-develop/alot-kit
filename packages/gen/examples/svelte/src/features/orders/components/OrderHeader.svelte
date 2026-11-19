<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { TOrder } from '@/types/main-api-types';

  let { order }: { order: TOrder } = $props();
</script>

<Box.Header><h2 class="text-xl font-semibold text-foreground">{order.name}</h2></Box.Header>
