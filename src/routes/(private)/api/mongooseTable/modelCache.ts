import * as models from '$lib/server/mongoose/models';
import { type Model, type ModelName } from './';

export const modelCache = new Map<ModelName, Model<any>>(
	Object.entries(models) as [ModelName, Model<any>][]
);
