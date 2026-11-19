<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';
  import type { ZodForm } from './form';
  import { fromStore } from 'svelte/store';
  import { cn } from './lib';

  const { form, children, class: className, ...rest }: Omit<HTMLFormAttributes, 'onsubmit'> & { form: ZodForm<T>; children: Snippet } = $props();
  const errors = $derived(fromStore(form.controller.errors));
  const enhance = (node: HTMLFormElement) => form.controller.enhance(node);
</script>

<form method="POST" use:enhance class={cn('flex flex-col gap-4', className)} {...rest}>
  {#if errors.current._errors}<div role="alert" class="text-destructive">{errors.current._errors.join(', ')}</div>{/if}
  {@render children()}
</form>
