import { getActions, getLoad } from '$lib/prismaTable';

export const pageServer = async (modelName: string) => {
	return {
		actions: getActions(modelName),
		load: () => getLoad(modelName)
	};
};
