import { fail } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createFetcher } from '@alot-web-develop/api';
import { env } from '@/config/env';
import { serverAuthAdapter, requireSession } from '@/lib/auth.server';
import { __name__Schema } from '@/features/__feature__/schemas/__name__Schema';
import type { T__Name__ } from '@/types/main-api-types';

const load: PageServerLoad = async (event) => {
  await requireSession(event);
  return { form: await superValidate(zod4(__name__Schema)) };
};

const actions = {
  default: async (event) => {
    await requireSession(event);
    const form = await superValidate(event.request, zod4(__name__Schema));
    if (!form.valid) return fail(400, { form });
    const token = await serverAuthAdapter.getToken(event);
    if (!token) return setError(form, '', 'Unauthorized', { status: 401 });
    const api = createFetcher({ baseUrl: env.PUBLIC_API_URL, getToken: () => token });
    const result = await api.post<T__Name__>('/__names-kebab__', { body: form.data });
    if (result.error) return setError(form, '', result.errorDetails.message);
    return { form, __name__: result.data };
  },
} satisfies Actions;

export { load, actions };
