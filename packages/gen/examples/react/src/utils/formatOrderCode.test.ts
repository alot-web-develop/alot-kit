import { describe, expect, it } from 'vitest';
import { formatOrderCode } from './formatOrderCode';

describe('formatOrderCode', () => {
  it('returns the expected value', () => {
    expect(formatOrderCode('  value  ')).toBe('value');
  });
});
