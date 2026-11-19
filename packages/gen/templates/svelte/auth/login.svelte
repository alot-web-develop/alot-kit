<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getRedirectTarget } from '@/lib/authRedirect';
  import { useAuth } from '@/lib/authContext';
  import { useI18n } from '@/lib/i18n.svelte';

  const auth = useAuth();
  const i18n = useI18n();
  let email = $state('');
  let password = $state('');
  let pending = $state(false);
  let error = $state<string | null>(null);
  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (pending) return;
    pending = true;
    error = null;
    try {
      await auth.signIn({ email, password });
      await goto(getRedirectTarget(page.url.searchParams.get('redirectTo'), page.url.origin));
    } catch (cause) {
      error = cause instanceof Error ? cause.message : i18n.t('error');
    } finally {
      pending = false;
    }
  };
</script>

<form method="POST" onsubmit={submit} class="mx-auto flex w-full max-w-sm flex-col gap-4 p-6 text-foreground">
  <h1 class="text-xl font-semibold">{i18n.t('signIn')}</h1>
  <label class="flex flex-col gap-1">{i18n.t('email')}
    <input type="email" name="email" autocomplete="username" required bind:value={email} class="rounded-md border border-border bg-surface-1 px-3 py-2" />
  </label>
  <label class="flex flex-col gap-1">{i18n.t('password')}
    <input type="password" name="password" autocomplete="current-password" required bind:value={password} class="rounded-md border border-border bg-surface-1 px-3 py-2" />
  </label>
  {#if error}<p role="alert" class="text-destructive">{error}</p>{/if}
  <button type="submit" disabled={pending} class="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{i18n.t(pending ? 'loading' : 'signIn')}</button>
</form>
