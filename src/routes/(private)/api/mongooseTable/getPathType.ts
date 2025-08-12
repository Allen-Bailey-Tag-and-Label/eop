import { type Model } from './';

export const getPathType = (model: Model<any>, key: string): string | undefined => {
	const p: any = model.schema.path(key);
	if (!p) return undefined;
	if (p.instance === 'Array') return p.caster?.instance ?? 'Array';
	return p.instance; // 'String' | 'Number' | 'Date' | 'Boolean' | 'ObjectID' | 'Mixed' | 'Array'
};
