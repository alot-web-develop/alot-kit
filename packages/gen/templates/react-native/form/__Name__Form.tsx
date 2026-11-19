import { Button } from '@alot-web-develop/ui-native/button';
import { Form, FormInput, useZodForm } from '@alot-web-develop/ui-native/form';
import { useTranslation } from 'react-i18next';
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
    <Form form={form} className="flex-col gap-4">
      <FormInput name="name" label={t('__feature__.form.name')} />
      <Button onPress={() => void form.handleSubmit(onSubmit)()} disabled={isPending}>
        {t('common.save')}
      </Button>
    </Form>
  );
};

export { __Name__Form };
