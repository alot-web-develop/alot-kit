<script lang="ts">
  import { Form, FormInput, useZodForm } from '@alot-web-develop/ui-svelte/form';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { useI18n } from '@/lib/i18n.svelte';
  import { useFeatureTranslations } from '../locales';
  import { orderSchema, type TOrderFormValues } from '../schemas/orderSchema';

  let { data, onSuccess }: { data: SuperValidated<TOrderFormValues>; onSuccess?: (values: TOrderFormValues) => void } = $props();
  const i18n = useI18n();
  const feature = useFeatureTranslations();
  const form = useZodForm(orderSchema, { initial: () => data, onSuccess: (values) => onSuccess?.(values) });
</script>

<Form {form} class="flex flex-col gap-4">
  <FormInput {form} name="name" label={feature.t('name')} />
  <button type="submit" disabled={form.submitting.current} class="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
    {i18n.t(form.submitting.current ? 'saving' : 'save')}
  </button>
</Form>
