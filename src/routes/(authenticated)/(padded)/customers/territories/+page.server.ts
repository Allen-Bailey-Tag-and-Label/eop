import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({ modelName: 'CustomerTerritory', sortKey: 'label' });

export { actions, load };
