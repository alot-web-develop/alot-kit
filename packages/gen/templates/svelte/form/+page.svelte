<script lang="ts">
  import type { PageData } from './$types';
  import FeatureForm from '@/features/__feature__/components/__Name__Form.svelte';

  let { data }: { data: PageData } = $props();
</script>

<FeatureForm data={data.form} />
