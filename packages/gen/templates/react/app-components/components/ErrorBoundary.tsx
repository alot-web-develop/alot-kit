import { Alert, AlertDescription, AlertTitle } from '@alot-web-develop/ui/alert';
import { Button } from '@alot-web-develop/ui/button';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorFallbackProps {
  onRetry: () => void;
}

const ErrorFallback = ({ onRetry }: ErrorFallbackProps) => {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive" className="m-4 w-auto">
      <AlertTitle>{t('common.error')}</AlertTitle>
      <AlertDescription>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return this.props.fallback ?? <ErrorFallback onRetry={this.reset} />;
  }
}

export type { ErrorBoundaryProps };
export { ErrorBoundary };
