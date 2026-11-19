import { Input } from '@alot-web-develop/ui/input';
import { Label } from '@alot-web-develop/ui/label';
import { type ComponentProps, useId } from 'react';
import { useFormContext } from 'react-hook-form';

interface FormInputProps extends Omit<ComponentProps<'input'>, 'name'> {
  name: string;
  label: string;
  description?: string;
}

const FormInput = ({ name, label, description, ...rest }: FormInputProps) => {
  const id = useId();
  const { register, getFieldState, formState } = useFormContext();
  const { error } = getFieldState(name, formState);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined}
        {...register(name)}
        {...rest}
      />
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
};

export type { FormInputProps };
export { FormInput };
