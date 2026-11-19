import { PageShell } from '@alot-web-develop/ui-native/page-shell';
import { Redirect } from 'expo-router';
import { LoginForm } from '@/lib/auth/LoginForm';
import { useSession } from '@/lib/auth';

const LoginRoute = () => {
  const { user } = useSession();

  if (user) return <Redirect href="/" />;

  return (
    <PageShell scroll>
      <LoginForm />
    </PageShell>
  );
};

export default LoginRoute;
