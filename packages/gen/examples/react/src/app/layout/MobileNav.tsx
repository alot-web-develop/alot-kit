import { useState } from 'react';
import { Button } from '@alot-web-develop/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@alot-web-develop/ui/sheet';
import { useTranslation } from 'react-i18next';
import { AppNav } from './AppNav';

const MobileNav = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          {t('common.menu')}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{t('common.appName')}</SheetTitle>
        </SheetHeader>
        <AppNav onClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

export { MobileNav };
