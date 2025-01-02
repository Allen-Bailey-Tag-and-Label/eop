import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({ modelName: 'CRMInteractionType' });

export { actions, load };
