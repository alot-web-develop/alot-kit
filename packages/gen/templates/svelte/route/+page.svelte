<script lang="ts">
  import Page from '@/features/__feature__/pages/__Name__Page.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<Page id={data.id} />
