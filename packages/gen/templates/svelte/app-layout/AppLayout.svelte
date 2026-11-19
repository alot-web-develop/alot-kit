<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  import { useI18n } from './i18n.svelte';
  import { useTheme, type ThemeMode } from './theme.svelte';
  import { useAuth } from './authContext';

  let { children, navigation, header, class: className, ...rest }: HTMLAttributes<HTMLDivElement> & {
    children: Snippet; navigation?: Snippet; header?: Snippet;
  } = $props();
  const i18n = useI18n();
  const theme = useTheme();
  const auth = useAuth();
  let menuOpen = $state(false);
</script>

{#snippet nav()}
  {#if navigation}{@render navigation()}{:else}<a href="/" class="rounded-md px-3 py-2 hover:bg-surface-2">{i18n.t('home')}</a>{/if}
{/snippet}

<div class={cn('min-h-dvh bg-background text-foreground md:grid md:grid-cols-[16rem_1fr]', className)} {...rest}>
  <aside class="hidden border-r border-border bg-surface-1 p-4 md:block">
    <nav aria-label={i18n.t('navigation')} class="flex flex-col gap-2">{@render nav()}</nav>
  </aside>
  <div class="min-w-0">
    <header class="flex flex-wrap items-center gap-4 border-b border-border p-4">
      <button type="button" class="md:hidden" aria-expanded={menuOpen} aria-controls="mobile-navigation" onclick={() => { menuOpen = !menuOpen; }}>{i18n.t(menuOpen ? 'close' : 'menu')}</button>
      {@render header?.()}
      <div class="ml-auto flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2">{i18n.t('theme')}
          <select value={theme.mode} onchange={(event) => theme.setMode(event.currentTarget.value as ThemeMode)} class="rounded-md border border-border bg-surface-1">
            <option value="light">{i18n.t('light')}</option><option value="dark">{i18n.t('dark')}</option><option value="system">{i18n.t('system')}</option>
          </select>
        </label>
        <label class="flex items-center gap-2">{i18n.t('language')}
          <select value={i18n.locale} onchange={(event) => i18n.setLocale(event.currentTarget.value === 'it' ? 'it' : 'en')} class="rounded-md border border-border bg-surface-1">
            <option value="en">English</option><option value="it">Italiano</option>
          </select>
        </label>
        <button type="button" onclick={() => auth.signOut()}>{i18n.t('signOut')}</button>
      </div>
    </header>
    {#if menuOpen}
      <nav id="mobile-navigation" aria-label={i18n.t('navigation')} class="flex flex-col gap-2 border-b border-border bg-surface-1 p-4 md:hidden">{@render nav()}</nav>
    {/if}
    <main class="p-4 md:p-6">{@render children()}</main>
  </div>
</div>
