import { Button } from '@alot-web-develop/ui/button';
import { useTranslation } from 'react-i18next';
import { Form, FormInput, useZodForm } from '@/components/form';
import { __name__Schema, type T__Name__FormValues } from '../schemas/__name__Schema';

interface __Name__FormProps {
  defaultValues?: Partial<T__Name__FormValues>;
  isPending?: boolean;
  onSubmit: (values: T__Name__FormValues) => void;
}

const __Name__Form = ({ defaultValues, isPending, onSubmit }: __Name__FormProps) => {
  const { t } = useTranslation();
  const form = useZodForm(__name__Schema, { defaultValues });

  return (
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormInput name="name" label={t('__feature__.form.name')} />
      <Button type="submit" disabled={isPending}>
        {t('common.save')}
      </Button>
    </Form>
  );
};

export { __Name__Form };
