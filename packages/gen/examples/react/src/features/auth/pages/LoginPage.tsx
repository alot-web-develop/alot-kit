import { Card, CardContent, CardHeader, CardTitle } from '@alot-web-develop/ui/card';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/PageShell';
import { LoginForm } from '../components/LoginForm';
import { useSignIn } from '../hooks/useSignIn';

interface LoginPageProps {
  onSignedIn: () => void;
}

const LoginPage = ({ onSignedIn }: LoginPageProps) => {
  const { t } = useTranslation();
  const signIn = useSignIn(onSignedIn);

  return (
    <PageShell className="flex min-h-svh items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl">{t('auth.login.title')}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm isPending={signIn.isPending} onSubmit={signIn.mutate} />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export { LoginPage };
