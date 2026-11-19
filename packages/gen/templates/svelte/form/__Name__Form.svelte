<script lang="ts">
  import { Form, FormInput, useZodForm } from '@alot-web-develop/ui-svelte/form';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { useI18n } from '@/lib/i18n.svelte';
  import { useFeatureTranslations } from '../locales';
  import { __name__Schema, type T__Name__FormValues } from '../schemas/__name__Schema';

  let { data, onSuccess }: { data: SuperValidated<T__Name__FormValues>; onSuccess?: (values: T__Name__FormValues) => void } = $props();
  const i18n = useI18n();
  const feature = useFeatureTranslations();
  const form = useZodForm(__name__Schema, { initial: () => data, onSuccess: (values) => onSuccess?.(values) });
</script>

<Form {form} class="flex flex-col gap-4">
  <FormInput {form} name="name" label={feature.t('name')} />
  <button type="submit" disabled={form.submitting.current} class="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
    {i18n.t(form.submitting.current ? 'saving' : 'save')}
  </button>
</Form>
