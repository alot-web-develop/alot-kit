<script lang="ts">
  import type { Snippet } from 'svelte';
  import { provideOrder, type OrderContext } from './orderContext';

  let { value, children }: { value: OrderContext; children: Snippet } = $props();
  provideOrder({ get value() { return value.value; } });
</script>

{@render children()}
