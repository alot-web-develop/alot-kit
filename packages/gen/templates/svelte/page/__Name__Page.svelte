<script lang="ts">
  import { QueryBoundary } from '@alot-web-develop/ui-svelte/query-boundary';
  import { PageShell } from '@alot-web-develop/ui-svelte/page-shell';
  import { useGet__Name__ } from '@/api/queries/useGet__Name__';
  import EntityHeader from '../components/__Name__Header.svelte';
  import EntityContent from '../components/__Name__Content.svelte';

  let { id }: { id: string } = $props();
  const query = useGet__Name__(() => id);
</script>

<PageShell>
  <QueryBoundary {query}>
    {#snippet children(__name__)}
      <EntityHeader __name__={__name__} />
      <EntityContent __name__={__name__} />
    {/snippet}
  </QueryBoundary>
</PageShell>
