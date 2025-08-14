import { type Model } from './';

export const buildRefLabelExprBuilder = (refModel: Model<any>, labelFn?: (doc: any) => any) => {
	// 1) If we can parse common patterns from the function source, use them.
	if (labelFn) {
		const src = Function.prototype.toString.call(labelFn);

		// Ternary: doc.isDirectory ? doc.label : doc.href
		const ternary = /doc\.(\w+)\s*\?\s*doc\.(\w+)\s*:\s*doc\.(\w+)/.exec(src);
		if (ternary) {
			const [, cond, t, f] = ternary;
			return (as: string) => ({
				$cond: [{ $ifNull: [`$${as}.${cond}`, false] }, `$${as}.${t}`, `$${as}.${f}`]
			});
		}

		// Simple property: return doc.foo
		const simpleProp = /return\s+doc\.(\w+)/.exec(src);
		if (simpleProp) {
			const [, p] = simpleProp;
			return (as: string) => `$${as}.${p}`;
		}

		// Template like `${doc.href}`
		const templateProp = /doc\.(\w+)/.exec(src);
		if (templateProp) {
			const [, p] = templateProp;
			return (as: string) => ({
				$toString: { $ifNull: [`$${as}.${p}`, ''] }
			});
		}
	}

	// 2) Fallback: choose a reasonable label field from the schema
	const candidates = ['label', 'name', 'username', 'title', 'email', 'href'];
	for (const c of candidates) {
		if (refModel.schema.path(c)) return (as: string) => `$${as}.${c}`;
	}

	// 3) Last resort: any string field, else _id
	const stringPath =
		Object.entries(refModel.schema.paths).find(([, sp]: any) => sp.instance === 'String')?.[0] ??
		'_id';
	return (as: string) => `$${as}.${stringPath}`;
};
