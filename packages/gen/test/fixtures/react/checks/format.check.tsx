import { formatCurrency, formatDate, formatNumber } from '@alot-web-develop/utils';
import * as format from '@alot-web-develop/utils/format';
import { dayjs, isValidDate, parseDate } from '@alot-web-develop/utils/dates';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { useOrderColumns } from '@/features/orders/hooks/useOrderColumns';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'it-IT' } }),
}));

test('resolves root and subpath exports from the installed utils tarball', () => {
  expect(format.formatDate).toBe(formatDate);
  expect(format.formatNumber).toBe(formatNumber);
  expect(format.formatCurrency).toBe(formatCurrency);
  expect(formatNumber(12345.5, 'it-IT')).toBe('12.345,5');
  expect(formatCurrency(12345.5, 'EUR', 'it-IT')).toBe('12.345,50\u00a0€');
  expect(formatDate('2026-01-02T00:30:00Z', 'en-US', { timeZone: 'America/Los_Angeles' })).toBe('01/01/2026');
  expect(formatDate('2026-01-02', 'it-IT', { pattern: 'D MMMM YYYY', timeZone: 'UTC' })).toBe('2 gennaio 2026');
  expect(dayjs.isDayjs(parseDate('2024-02-29'))).toBe(true);
  expect(isValidDate('2025-02-29')).toBe(false);
});

test('generated list columns format API dates with the active translation locale', () => {
  const order = { id: 'one', name: 'Order one', createdAt: '2026-01-02T12:00:00Z' };
  const Cell = () => {
    const columns = useOrderColumns();
    return <span>{columns.find((column) => column.id === 'createdAt')?.cell(order)}</span>;
  };
  const expected = parseDate(order.createdAt, { locale: 'it-IT' }).format('L');
  expect(renderToStaticMarkup(<Cell />)).toBe(`<span>${expected}</span>`);
});
