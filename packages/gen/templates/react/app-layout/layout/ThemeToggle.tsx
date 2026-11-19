import { Button } from '@alot-web-develop/ui/button';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { nextTheme } from '@/lib/theme/theme';

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Button variant="outline" size="sm" onClick={() => setTheme(nextTheme(theme))}>
      {t(`common.theme.${theme}`)}
    </Button>
  );
};

export { ThemeToggle };
