import { getModels } from './getModels';
import type { Field } from './types';

export const getFields = (modelName: string) =>
	<Field[]>getModels().find((model) => model.name === modelName)?.fields || [];
