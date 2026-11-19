<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { provideTheme, type ThemeMode } from './theme.svelte';

  let { children }: { children: Snippet } = $props();
  let mode = $state<ThemeMode>('system');
  let ready = $state(false);

  provideTheme({ get mode() { return mode; }, setMode: (value) => { mode = value; } });

  onMount(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') mode = saved;
    } catch {}
    ready = true;
  });

  $effect(() => {
    if (!ready) return;
    const preference = mode;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };
    apply();
    try { localStorage.setItem('theme', preference); } catch {}
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  });
</script>

{@render children()}
