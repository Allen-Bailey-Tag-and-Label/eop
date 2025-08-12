import { type Model } from './';

export const isKeyAllowed = (model: Model<any>, key: string) => {
	// Allow exact schema paths
	const t = model.schema.pathType(key); // 'real' | 'virtual' | 'nested' | 'adhocOrUndefined'
	if (t === 'real' || t === 'virtual' || t === 'nested') return true;

	// If not exact, allow keys that have a declared parent (Mixed, Map, subdoc, array of subdocs, etc.)
	const parts = key.split('.');
	for (let i = parts.length - 1; i > 0; i--) {
		const parentKey = parts.slice(0, i).join('.');
		const parentType = model.schema.pathType(parentKey);
		if (parentType !== 'adhocOrUndefined') return true; // parent exists in schema
	}
	return false;
};
