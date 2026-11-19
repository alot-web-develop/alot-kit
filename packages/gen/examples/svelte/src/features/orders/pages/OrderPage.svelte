<script lang="ts">
  import { QueryBoundary } from '@alot-web-develop/ui-svelte/query-boundary';
  import { PageShell } from '@alot-web-develop/ui-svelte/page-shell';
  import { useGetOrder } from '@/api/queries/useGetOrder';
  import EntityHeader from '../components/OrderHeader.svelte';
  import EntityContent from '../components/OrderContent.svelte';

  let { id }: { id: string } = $props();
  const query = useGetOrder(() => id);
</script>

<PageShell>
  <QueryBoundary {query}>
    {#snippet children(order)}
      <EntityHeader order={order} />
      <EntityContent order={order} />
    {/snippet}
  </QueryBoundary>
</PageShell>
