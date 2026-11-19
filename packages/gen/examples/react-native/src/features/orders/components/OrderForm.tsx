import { Button } from '@alot-web-develop/ui-native/button';
import { Form, FormInput, useZodForm } from '@alot-web-develop/ui-native/form';
import { useTranslation } from 'react-i18next';
import { orderSchema, type TOrderFormValues } from '../schemas/orderSchema';

interface OrderFormProps {
  defaultValues?: Partial<TOrderFormValues>;
  isPending?: boolean;
  onSubmit: (values: TOrderFormValues) => void;
}

const OrderForm = ({ defaultValues, isPending, onSubmit }: OrderFormProps) => {
  const { t } = useTranslation();
  const form = useZodForm(orderSchema, { defaultValues });

  return (
    <Form form={form} className="flex-col gap-4">
      <FormInput name="name" label={t('orders.form.name')} />
      <Button onPress={() => void form.handleSubmit(onSubmit)()} disabled={isPending}>
        {t('common.save')}
      </Button>
    </Form>
  );
};

export { OrderForm };
