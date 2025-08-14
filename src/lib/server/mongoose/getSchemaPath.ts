import { type Model } from './';

export const getSchemaPath = (model: Model<any>, key: string) =>
	model.schema.path(key) as any | undefined;
