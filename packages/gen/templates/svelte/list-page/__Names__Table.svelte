<script lang="ts">
  import { formatDate } from '@alot-web-develop/utils/format';
  import type { T__Name__ } from '@/types/main-api-types';
  import { useI18n } from '@/lib/i18n.svelte';

  let { items }: { items: T__Name__[] } = $props();
  const i18n = useI18n();
</script>

<div class="overflow-x-auto rounded-md border border-border">
  <table class="w-full text-left text-foreground">
    <thead class="bg-surface-1"><tr><th scope="col" class="p-3">{i18n.t('name')}</th><th scope="col" class="p-3">{i18n.t('createdAt')}</th></tr></thead>
    <tbody>
      {#each items as item (item.id)}
        <tr class="border-t border-border">
          <td class="p-3"><a href={`/__names-kebab__/${encodeURIComponent(item.id)}`} class="text-primary">{item.name}</a></td>
          <td class="p-3 text-muted-foreground">{formatDate(item.createdAt, i18n.locale)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
