<script lang="ts">
  import type { Snippet } from 'svelte';
  import AppProviders from '@/lib/AppProviders.svelte';
  import '../app.css';
  let { children }: { children: Snippet } = $props();
</script>
<AppProviders>{@render children()}</AppProviders>
