import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({ modelName: 'CRMInteraction' });

export { actions, load };
