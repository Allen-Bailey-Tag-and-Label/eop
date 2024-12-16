import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({ modelName: 'Route' });

export { actions, load };
