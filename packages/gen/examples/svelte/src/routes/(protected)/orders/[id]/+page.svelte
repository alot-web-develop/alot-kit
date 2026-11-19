<script lang="ts">
  import Page from '@/features/orders/pages/OrderPage.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<Page id={data.id} />
