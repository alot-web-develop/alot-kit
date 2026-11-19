<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  import { useI18n } from '@/lib/i18n.svelte';
  import { formatDate } from '@alot-web-develop/utils/format';
  import type { TOrder } from '@/types/main-api-types';
  let { order, class: className, ...rest }: HTMLAttributes<HTMLDivElement> & { order: TOrder } = $props();
  const i18n = useI18n();
</script>
<Box.Root class={cn('flex flex-col gap-2', className)} {...rest}>
  <Box.Header><h2 class="text-lg font-semibold text-foreground">{order.name}</h2></Box.Header>
  <Box.Body><span class="text-sm text-muted-foreground">{formatDate(order.createdAt, i18n.locale)}</span></Box.Body>
</Box.Root>
