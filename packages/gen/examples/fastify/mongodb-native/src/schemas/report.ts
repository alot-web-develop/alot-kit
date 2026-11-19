import { z } from 'zod';

const reportBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const reportResultSchema = z.object({
  name: z.string(),
  processedAt: z.iso.datetime(),
});

type TReportBody = z.infer<typeof reportBodySchema>;
type TReportResult = z.infer<typeof reportResultSchema>;

export { reportBodySchema, reportResultSchema };
export type { TReportBody, TReportResult };
