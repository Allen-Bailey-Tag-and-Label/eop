import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer('Route');

export { actions, load };
