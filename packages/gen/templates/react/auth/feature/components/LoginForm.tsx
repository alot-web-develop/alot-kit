import { Button } from '@alot-web-develop/ui/button';
import { useTranslation } from 'react-i18next';
import { Form, FormInput, useZodForm } from '@/components/form';
import { loginSchema, type TLoginFormValues } from '../schemas/loginSchema';

interface LoginFormProps {
  isPending?: boolean;
  onSubmit: (values: TLoginFormValues) => void;
}

const LoginForm = ({ isPending, onSubmit }: LoginFormProps) => {
  const { t } = useTranslation();
  const form = useZodForm(loginSchema, { defaultValues: { email: '', password: '' } });

  return (
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormInput name="email" type="email" autoComplete="email" label={t('auth.login.email')} />
      <FormInput name="password" type="password" autoComplete="current-password" label={t('auth.login.password')} />
      <Button type="submit" disabled={isPending}>
        {t('auth.login.submit')}
      </Button>
    </Form>
  );
};

export { LoginForm };
