<script lang="ts">
  import type { Snippet } from 'svelte';
  import { I18n, provideI18n } from './i18n.svelte';

  let { children }: { children: Snippet } = $props();
  const i18n = new I18n();
  provideI18n(i18n);
  $effect(() => { document.documentElement.lang = i18n.locale; });
</script>

{@render children()}
