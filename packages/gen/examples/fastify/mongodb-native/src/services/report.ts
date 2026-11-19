type TReportDeps = { now: () => Date };
type TReportInput = { name: string };
type TReportResult = { name: string; processedAt: string };

const createReportService = ({ now }: TReportDeps) => {
  const run = async (input: TReportInput): Promise<TReportResult> => ({
    name: input.name.trim(),
    processedAt: now().toISOString(),
  });

  return { run };
};

type TReportService = ReturnType<typeof createReportService>;

export { createReportService };
export type { TReportDeps, TReportInput, TReportResult, TReportService };
