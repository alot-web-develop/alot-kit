<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useFeatureTranslations } from '@/features/orders/locales';

  let { children, actions }: { children: Snippet; actions?: Snippet } = $props();
  const feature = useFeatureTranslations();
</script>

<section class="flex flex-col gap-4">
  <header class="flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-xl font-semibold text-foreground">{feature.t('title')}</h1>
    {@render actions?.()}
  </header>
  {@render children()}
</section>
