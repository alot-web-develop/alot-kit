import { expect, test } from 'vitest';
import { getRedirectTarget } from '@/lib/authRedirect';

test('returns local paths and rejects external redirect targets', () => {
  const origin = 'https://app.example';
  expect(getRedirectTarget('/orders?page=2#details', origin)).toBe('/orders?page=2#details');
  for (const target of [null, 'https://other.example', '//other.example', '/\\other.example', 'javascript:alert(1)']) {
    expect(getRedirectTarget(target, origin)).toBe('/');
  }
});
