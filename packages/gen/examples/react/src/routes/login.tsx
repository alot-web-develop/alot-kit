import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@/features/auth/pages/LoginPage';

const LoginRoute = () => {
  const navigate = Route.useNavigate();

  return <LoginPage onSignedIn={() => navigate({ to: '/' })} />;
};

const Route = createFileRoute('/login')({ component: LoginRoute });

export { Route };
