import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type TLoginFormValues = z.infer<typeof loginSchema>;

export { loginSchema };
export type { TLoginFormValues };
