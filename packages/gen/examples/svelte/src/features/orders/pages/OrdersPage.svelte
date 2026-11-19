<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PageShell } from '@alot-web-develop/ui-svelte/page-shell';
  import { QueryBoundary } from '@alot-web-develop/ui-svelte/query-boundary';
  import { useListOrders } from '@/api/queries/useListOrders';
  import { useI18n } from '@/lib/i18n.svelte';
  import { useFeatureTranslations } from '../locales';
  import EntityTable from '../components/OrdersTable.svelte';
  import { readOrderFilters } from '../utils/orderFilters';

  const i18n = useI18n();
  const feature = useFeatureTranslations();
  const filters = $derived(readOrderFilters(page.url.searchParams));
  const query = useListOrders(() => filters);

  const update = (changes: Record<string, string>) => {
    const url = new URL(page.url);
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    void goto(url, { keepFocus: true, noScroll: true });
  };

  const submitSearch = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    update({ search: String(data.get('search') ?? '').trim(), page: '1' });
  };
</script>

<PageShell>
  <h2 class="text-xl font-semibold text-foreground">{feature.t('title')}</h2>
  <form onsubmit={submitSearch} class="flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-foreground">{i18n.t('search')}
      <input name="search" type="search" value={filters.search} class="rounded-md border border-border bg-surface-1 px-3 py-2" />
    </label>
    <button type="submit" class="rounded-md bg-primary px-4 py-2 text-primary-foreground">{i18n.t('search')}</button>
  </form>
  <QueryBoundary {query} isEmpty={(data) => data.items.length === 0}>
    {#snippet children(data)}<EntityTable items={data.items} />{/snippet}
  </QueryBoundary>
  <nav aria-label={i18n.t('page')} class="flex items-center gap-4 text-foreground">
    <button type="button" disabled={filters.page <= 1} onclick={() => update({ page: String(filters.page - 1) })}>{i18n.t('previous')}</button>
    <span aria-live="polite">{i18n.t('page')} {filters.page}</span>
    <button type="button" disabled={!query.data || filters.page * filters.limit >= query.data.total} onclick={() => update({ page: String(filters.page + 1) })}>{i18n.t('next')}</button>
  </nav>
</PageShell>
