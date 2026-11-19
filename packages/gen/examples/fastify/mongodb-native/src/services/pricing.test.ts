import { describe, expect, it } from 'vitest';
import { createPricingService } from './pricing.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('pricing service', () => {
  it('returns the processed result', async () => {
    const service = createPricingService({ now: () => NOW });

    await expect(service.run({ name: '  value  ' })).resolves.toEqual({
      name: 'value',
      processedAt: NOW.toISOString(),
    });
  });
});
