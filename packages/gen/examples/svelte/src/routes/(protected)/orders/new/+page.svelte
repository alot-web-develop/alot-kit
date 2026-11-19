<script lang="ts">
  import type { PageData } from './$types';
  import FeatureForm from '@/features/orders/components/OrderForm.svelte';

  let { data }: { data: PageData } = $props();
</script>

<FeatureForm data={data.form} />
