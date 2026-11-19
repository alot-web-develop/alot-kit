import type { LayoutServerLoad } from './$types';
import { requireSession } from '@/lib/auth.server';

const load: LayoutServerLoad = async (event) => ({ session: await requireSession(event) });

export { load };
