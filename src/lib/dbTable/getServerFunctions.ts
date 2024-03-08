import { getActions, getLoadData } from '.';
import type { ModelName, Options } from './types';

export const getServerFunctions = async (modelName: ModelName, options: Options = {}) => {
	// set default options
	const defaultOptions: Options = {
		columns: new Map(),
		filteredColumns: [],
		getRelationLabelFunctions: new Map(),
		orderBy: []
	};

	// assign default options with user supplied options
	options = Object.assign(defaultOptions, options);

	// make sure option values exist
	options.columns = options.columns || new Map();
	options.columnOrder = options.columnOrder || [];
	options.filteredColumns = options.filteredColumns || [];
	options.getRelationLabelFunctions = options.getRelationLabelFunctions || new Map();

	// update columns
	for (const [key, getRelationLabel] of options.getRelationLabelFunctions) {
		options.columns.set(key, { ...options.columns.get(key), getRelationLabel });
	}

	return {
		actions: await getActions(),
		load: async () => await getLoadData(modelName, options)
	};
};
