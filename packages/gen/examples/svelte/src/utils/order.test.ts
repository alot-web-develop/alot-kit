import { describe, expect, it } from 'vitest';
import { order } from './order';

describe('order', () => {
  it('returns the expected value', () => {
    expect(order('  value  ')).toBe('value');
  });
});
