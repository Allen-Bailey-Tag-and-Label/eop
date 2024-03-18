import { getActions, getFields, getLoadData, getModel, updateOptions } from '.';
import type { ModelName, Options } from './types';

export const getServerFunctions = async (modelName: ModelName, options: Options = {}) => {
	options = updateOptions(modelName, options);

	return {
		actions: await getActions(options),
		load: async () => await getLoadData(modelName, options)
	};
};
