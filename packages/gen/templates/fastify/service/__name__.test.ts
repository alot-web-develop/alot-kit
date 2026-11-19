import { describe, expect, it } from 'vitest';
import { create__Name__Service } from './__name__.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('__name__ service', () => {
  it('returns the processed result', async () => {
    const service = create__Name__Service({ now: () => NOW });

    await expect(service.run({ name: '  value  ' })).resolves.toEqual({
      name: 'value',
      processedAt: NOW.toISOString(),
    });
  });
});
