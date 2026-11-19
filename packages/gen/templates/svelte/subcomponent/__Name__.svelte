<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@alot-web-develop/ui-svelte/lib';
  import { useI18n } from '@/lib/i18n.svelte';
  import { formatDate } from '@alot-web-develop/utils/format';
  import type { T__Entity__ } from '@/types/main-api-types';
  let { __entity__, class: className, ...rest }: HTMLAttributes<HTMLDivElement> & { __entity__: T__Entity__ } = $props();
  const i18n = useI18n();
</script>
<Box.Root class={cn('flex flex-col gap-2', className)} {...rest}>
  <Box.Header><h2 class="text-lg font-semibold text-foreground">{__entity__.name}</h2></Box.Header>
  <Box.Body><span class="text-sm text-muted-foreground">{formatDate(__entity__.createdAt, i18n.locale)}</span></Box.Body>
</Box.Root>
