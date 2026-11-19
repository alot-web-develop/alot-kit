<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useI18n } from './i18n.svelte';

  let { children }: { children: Snippet } = $props();
  const i18n = useI18n();
</script>

<svelte:boundary>
  {@render children()}
  {#snippet failed(_error, reset)}
    <div role="alert" class="rounded-md border border-border bg-surface-1 p-4 text-foreground">
      <p>{i18n.t('error')}</p>
      <button type="button" onclick={reset} class="text-primary">{i18n.t('retry')}</button>
    </div>
  {/snippet}
</svelte:boundary>
