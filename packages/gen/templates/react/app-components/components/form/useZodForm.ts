import { zodResolver } from '@hookform/resolvers/zod';
import { type FieldValues, type UseFormProps, useForm } from 'react-hook-form';
import type { z } from 'zod';

const useZodForm = <TIn extends FieldValues, TOut extends FieldValues>(
  schema: z.ZodType<TOut, TIn>,
  options?: Omit<UseFormProps<TIn, unknown, TOut>, 'resolver'>,
) => useForm<TIn, unknown, TOut>({ ...options, resolver: zodResolver(schema) });

export { useZodForm };
