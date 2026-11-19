import { superForm, type SuperForm, type SuperValidated } from 'sveltekit-superforms';
import { zod4Client, type ClientValidationAdapter } from 'sveltekit-superforms/adapters';
import { fromStore } from 'svelte/store';
import type { z } from 'zod';

interface ZodForm<T extends Record<string, unknown>> {
  controller: SuperForm<T>;
  submitting: { readonly current: boolean };
}

const useZodForm = <T extends Record<string, unknown>>(schema: z.ZodType<T, T>, options: {
  initial: () => SuperValidated<T>;
  onSuccess?: (values: T) => void;
}): ZodForm<T> => {
  let successful = false;
  const controller = superForm(options.initial(), {
    validators: zod4Client(schema) as ClientValidationAdapter<T>,
    onResult: ({ result }) => { successful = result.type === 'success'; },
    onUpdated: ({ form }) => { if (successful && form.valid) options.onSuccess?.(form.data); },
  });
  return { controller, submitting: fromStore(controller.submitting) };
};

export { useZodForm };
export type { ZodForm };
export { default as Form } from './Form.svelte';
export { default as FormInput } from './FormInput.svelte';
