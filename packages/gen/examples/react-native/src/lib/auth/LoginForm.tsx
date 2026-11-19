import { Button } from '@alot-web-develop/ui-native/button';
import { Form, FormInput, useZodForm } from '@alot-web-develop/ui-native/form';
import { toast } from '@alot-web-develop/ui-native/toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { signIn } from './index';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type TLoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { t } = useTranslation();
  const form = useZodForm(loginSchema);

  const onSubmit = async (values: TLoginFormValues) => {
    try {
      await signIn(values);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed');
    }
  };

  return (
    <Form form={form} className="flex-col gap-4">
      <FormInput name="email" label={t('common.email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <FormInput name="password" label={t('common.password')} secureTextEntry autoComplete="current-password" textContentType="password" />
      <Button onPress={() => void form.handleSubmit(onSubmit)()}>{t('common.signIn')}</Button>
    </Form>
  );
};

export { LoginForm };
