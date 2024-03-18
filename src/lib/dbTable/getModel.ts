import { Prisma } from '@prisma/client';
import type { ModelName } from './types';

export const getModel = (modelName: ModelName) => {
	const models = Prisma.dmmf.datamodel.models;
	const model = models.find((model) => model.name === modelName);
	if (model === undefined) throw 'Could not find model';
	return model;
};
