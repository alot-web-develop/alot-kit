<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { CreateQueryResult } from '@tanstack/svelte-query';
  import { useI18n } from '@/lib/i18n.svelte';

  let { query, children, isEmpty, empty, error, loading }: {
    query: CreateQueryResult<T>;
    children: Snippet<[T]>;
    isEmpty?: (data: T) => boolean;
    empty?: Snippet;
    error?: Snippet<[Error, () => void]>;
    loading?: Snippet;
  } = $props();
  const i18n = useI18n();
  const retry = () => { void query.refetch(); };
</script>

{#if query.isPending}
  {#if loading}{@render loading()}{:else}<div role="status" class="animate-pulse rounded-md bg-surface-2 p-4 text-muted-foreground">{i18n.t('loading')}</div>{/if}
{:else if query.isError}
  {#if error}{@render error(query.error, retry)}{:else}<div role="alert" class="text-destructive"><p>{i18n.t('error')}</p><button type="button" onclick={retry}>{i18n.t('retry')}</button></div>{/if}
{:else if query.data !== undefined}
  {#if isEmpty?.(query.data)}
    {#if empty}{@render empty()}{:else}<p class="text-muted-foreground">{i18n.t('empty')}</p>{/if}
  {:else}{@render children(query.data)}{/if}
{/if}
