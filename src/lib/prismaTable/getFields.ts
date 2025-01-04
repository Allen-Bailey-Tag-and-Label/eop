import { getModels } from './getModels';

export const getFields = (modelName: string) =>
	getModels().find((model) => model.name === modelName)?.fields || [];
