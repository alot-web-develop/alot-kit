import type { PageLoad } from './$types';

const load: PageLoad = ({ params }) => ({ id: params.id });

export { load };
