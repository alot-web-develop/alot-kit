import { z } from "zod";

type TErrorBody = { code: string; message: string; details?: unknown };
type TOk<T> = { success: true; data: T };
type TFail = { success: false; error: TErrorBody };
type TEnvelope<T> = TOk<T> | TFail;

/**
 * Builds a success envelope, wrapping the payload in `{ success: true, data }`.
 *
 * @param data - Payload to return to the client.
 * @returns The success variant of {@link TEnvelope}.
 */
const ok = <T>(data: T): TOk<T> => ({ success: true, data });

/**
 * Builds a failure envelope, omitting `details` when it is absent.
 *
 * @param code - Machine-readable error code.
 * @param message - Human-readable error message.
 * @param details - Optional structured details attached to the error.
 * @returns The failure variant of {@link TEnvelope}.
 */
const fail = (code: string, message: string, details?: unknown): TFail => ({
  success: false,
  error: details === undefined ? { code, message } : { code, message, details },
});

/**
 * Returns a Zod schema for a success envelope carrying `data`.
 *
 * @param data - Schema describing the payload.
 * @returns A schema matching `{ success: true, data }`.
 */
const okSchema = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data });

const errorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type { TEnvelope, TErrorBody, TFail, TOk };
export { errorSchema, fail, ok, okSchema };
