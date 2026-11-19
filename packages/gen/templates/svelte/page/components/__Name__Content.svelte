<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { T__Name__ } from '@/types/main-api-types';

  let { __name__ }: { __name__: T__Name__ } = $props();
</script>

<Box.Body class="rounded-md border border-border bg-surface-1 p-4 text-foreground">{__name__.name}</Box.Body>
