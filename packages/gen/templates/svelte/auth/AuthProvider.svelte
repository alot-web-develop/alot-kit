<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { authAdapter } from './auth';
  import { provideAuth } from './authContext';

  let { children }: { children: Snippet } = $props();
  const session = authAdapter.useSession();
  const queryClient = useQueryClient();
  let previousUser: string | null | undefined;
  $effect(() => {
    if (session.current.isPending) return;
    const user = session.current.data?.user.id ?? null;
    if (previousUser !== undefined && previousUser !== user) queryClient.clear();
    previousUser = user;
  });
  provideAuth({
    get session() { return session.current; },
    signIn: authAdapter.signIn,
    signOut: authAdapter.signOut,
    getToken: authAdapter.getToken,
  });
</script>

{@render children()}
