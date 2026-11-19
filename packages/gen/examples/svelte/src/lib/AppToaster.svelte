<script lang="ts">
  import { Toaster } from 'svelte-sonner';
  import { useTheme } from './theme.svelte';

  const theme = useTheme();
</script>

<Toaster theme={theme.mode} />
