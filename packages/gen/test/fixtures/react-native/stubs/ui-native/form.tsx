import type { TextInputProps } from 'react-native';
import type { ReactNode } from 'react';
import type { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
export declare const useZodForm: <S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
  options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, 'resolver'>,
) => UseFormReturn<z.input<S>, unknown, z.output<S>>;
export declare const Form: <TIn extends FieldValues, TOut extends FieldValues>(props: {
  form: UseFormReturn<TIn, unknown, TOut>;
  className?: string;
  children: ReactNode;
}) => React.JSX.Element;
export declare const FormInput: (props: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'> & { name: string; label: string; description?: string }) => React.JSX.Element;
