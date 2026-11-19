<script lang="ts">
  import type { Snippet } from 'svelte';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import AppToaster from './AppToaster.svelte';
  import { createQueryClient } from './queryClient';
  import ThemeProvider from './ThemeProvider.svelte';
  import I18nProvider from './I18nProvider.svelte';
  import AuthProvider from './AuthProvider.svelte';
  import ErrorBoundary from './ErrorBoundary.svelte';

  let { children }: { children: Snippet } = $props();
  const queryClient = createQueryClient();
</script>

<ThemeProvider>
  <I18nProvider>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{@render children()}</AuthProvider>
        <AppToaster />
      </QueryClientProvider>
    </ErrorBoundary>
  </I18nProvider>
</ThemeProvider>
