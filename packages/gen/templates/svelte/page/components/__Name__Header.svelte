<script lang="ts">
  import * as Box from '@alot-web-develop/ui-svelte/box';
  import type { T__Name__ } from '@/types/main-api-types';

  let { __name__ }: { __name__: T__Name__ } = $props();
</script>

<Box.Header><h2 class="text-xl font-semibold text-foreground">{__name__.name}</h2></Box.Header>
