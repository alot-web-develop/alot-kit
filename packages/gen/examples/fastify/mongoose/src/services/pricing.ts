type TPricingDeps = { now: () => Date };
type TPricingInput = { name: string };
type TPricingResult = { name: string; processedAt: string };

const createPricingService = ({ now }: TPricingDeps) => {
  const run = async (input: TPricingInput): Promise<TPricingResult> => ({
    name: input.name.trim(),
    processedAt: now().toISOString(),
  });

  return { run };
};

type TPricingService = ReturnType<typeof createPricingService>;

export { createPricingService };
export type { TPricingDeps, TPricingInput, TPricingResult, TPricingService };
