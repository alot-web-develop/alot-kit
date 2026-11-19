<script lang="ts">
  import type { Snippet } from 'svelte';
  import { provide__Name__, type __Name__Context } from './__name__Context';

  let { value, children }: { value: __Name__Context; children: Snippet } = $props();
  provide__Name__({ get value() { return value.value; } });
</script>

{@render children()}
