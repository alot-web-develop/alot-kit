import { describe, expect, it } from 'vitest';
import { __name__ } from './__name__';

describe('__name__', () => {
  it('returns the expected value', () => {
    expect(__name__('  value  ')).toBe('value');
  });
});
