import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer('Role');

export { actions, load };
