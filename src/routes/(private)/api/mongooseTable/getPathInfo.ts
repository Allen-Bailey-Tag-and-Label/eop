import { type Model } from './';

export const getPathInfo = (model: Model<any>, key: string) => {
	// Try exact path
	let p: any = model.schema.path(key);
	if (p) {
		const inst = p.instance === 'Array' ? (p.caster?.instance ?? 'Array') : p.instance;
		return { exists: true, type: inst as string, parentType: undefined as string | undefined };
	}

	// Walk up parents: shipTo.StateProvinceCode -> shipTo
	const parts = key.split('.');
	for (let i = parts.length - 1; i > 0; i--) {
		const parentKey = parts.slice(0, i).join('.');
		const parent: any = model.schema.path(parentKey);
		if (parent) {
			const parentInst =
				parent.instance === 'Array' ? (parent.caster?.instance ?? 'Array') : parent.instance;
			return { exists: false, type: undefined as string | undefined, parentType: parentInst };
		}
	}
	return { exists: false, type: undefined as string | undefined, parentType: undefined };
};
