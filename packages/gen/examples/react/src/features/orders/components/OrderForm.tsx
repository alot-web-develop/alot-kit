import { Button } from '@alot-web-develop/ui/button';
import { useTranslation } from 'react-i18next';
import { Form, FormInput, useZodForm } from '@/components/form';
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
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormInput name="name" label={t('orders.form.name')} />
      <Button type="submit" disabled={isPending}>
        {t('common.save')}
      </Button>
    </Form>
  );
};

export { OrderForm };
