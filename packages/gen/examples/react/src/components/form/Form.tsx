import type { ComponentProps } from 'react';
import { type FieldValues, FormProvider, type UseFormReturn } from 'react-hook-form';

interface FormProps<TIn extends FieldValues, TOut extends FieldValues>
  extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: (values: TOut) => void;
}

const Form = <TIn extends FieldValues, TOut extends FieldValues>({
  form,
  onSubmit,
  children,
  ...rest
}: FormProps<TIn, TOut>) => {
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} {...rest}>
        {children}
      </form>
    </FormProvider>
  );
};

export { Form };
export type { FormProps };
