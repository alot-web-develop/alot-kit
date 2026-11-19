<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { Session } from './auth';
  import { useAuth } from './authContext';
  import { useI18n } from './i18n.svelte';

  let { children, initialSession }: { children: Snippet; initialSession?: Session | null } = $props();
  const auth = useAuth();
  const i18n = useI18n();
  const session = $derived(auth.session.isPending ? initialSession : auth.session.data);
  $effect(() => {
    if (!auth.session.isPending && !auth.session.data) {
      void goto(`/login?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`, { replaceState: true });
    }
  });
</script>

{#if session}
  {@render children()}
{:else if auth.session.error}
  <p role="alert" class="text-destructive">{i18n.t('error')}</p>
{:else}
  <p role="status" class="text-muted-foreground">{i18n.t('loading')}</p>
{/if}
