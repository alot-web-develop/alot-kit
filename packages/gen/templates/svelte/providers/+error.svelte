<script lang="ts">
  import { page } from '$app/state';
  import { useI18n } from '@/lib/i18n.svelte';

  const i18n = useI18n();
</script>

<div role="alert" class="p-6 text-foreground">
  <h1 class="text-xl font-semibold">{page.status}</h1>
  <p>{i18n.t('error')}</p>
  <a href="/" class="text-primary">{i18n.t('home')}</a>
</div>
