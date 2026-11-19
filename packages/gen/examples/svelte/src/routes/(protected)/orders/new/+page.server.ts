import { fail } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createFetcher } from '@alot-web-develop/api';
import { env } from '@/config/env';
import { serverAuthAdapter, requireSession } from '@/lib/auth.server';
import { orderSchema } from '@/features/orders/schemas/orderSchema';
import type { TOrder } from '@/types/main-api-types';

const load: PageServerLoad = async (event) => {
  await requireSession(event);
  return { form: await superValidate(zod4(orderSchema)) };
};

const actions = {
  default: async (event) => {
    await requireSession(event);
    const form = await superValidate(event.request, zod4(orderSchema));
    if (!form.valid) return fail(400, { form });
    const token = await serverAuthAdapter.getToken(event);
    if (!token) return setError(form, '', 'Unauthorized', { status: 401 });
    const api = createFetcher({ baseUrl: env.PUBLIC_API_URL, getToken: () => token });
    const result = await api.post<TOrder>('/orders', { body: form.data });
    if (result.error) return setError(form, '', result.errorDetails.message);
    return { form, order: result.data };
  },
} satisfies Actions;

export { load, actions };
