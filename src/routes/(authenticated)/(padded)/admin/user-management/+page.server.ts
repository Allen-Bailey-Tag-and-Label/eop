import { pageServer } from '$lib/prismaTable';

const { actions, load } = await pageServer({
	modelName: 'User'
});

export { actions, load };
