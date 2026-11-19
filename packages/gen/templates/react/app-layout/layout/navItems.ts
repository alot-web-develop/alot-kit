import type { LinkProps } from '@tanstack/react-router';
import type { ParseKeys } from 'i18next';

interface NavItem {
  to: LinkProps['to'];
  labelKey: ParseKeys;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [{ to: '/', labelKey: 'common.nav.home', exact: true }];

export type { NavItem };
export { NAV_ITEMS };
