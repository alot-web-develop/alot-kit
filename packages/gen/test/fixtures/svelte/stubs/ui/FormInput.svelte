<script lang="ts" generics="T extends Record<string, unknown>">
  import { Field, Control, Label, FieldErrors } from 'formsnap';
  import { formFieldProxy, type FormPathLeaves } from 'sveltekit-superforms';
  import { fromStore } from 'svelte/store';
  import type { ZodForm } from './form';

  const { form, name, label }: { form: ZodForm<T>; name: FormPathLeaves<T, string>; label: string } = $props();
  const value = $derived(fromStore(formFieldProxy(form.controller, name).value));
</script>

<Field form={form.controller} {name}>
  <Control>
    {#snippet children({ props })}
      <Label class="text-foreground">{label}</Label>
      <input {...props} bind:value={value.current} class="rounded-md border border-border bg-surface-1 px-3 py-2 text-foreground" />
    {/snippet}
  </Control>
  <FieldErrors class="text-sm text-destructive" />
</Field>
