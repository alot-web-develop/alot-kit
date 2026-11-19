import { describe, expect, it } from 'vitest';
import { formatOrder } from './formatOrder';

describe('formatOrder', () => {
  it('returns the expected value', () => {
    expect(formatOrder('  value  ')).toBe('value');
  });
});
