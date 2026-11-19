<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import RequireAuth from '@/lib/RequireAuth.svelte';
  import AppLayout from '@/lib/AppLayout.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<RequireAuth initialSession={data.session}>
  <AppLayout>{@render children()}</AppLayout>
</RequireAuth>
