export const applyColumnsOrder = (
	columns: Array<string | { key: string; [k: string]: any }>,
	order: string[]
) => {
	if (!order?.length) return columns;

	const keyOf = (c: any) => (typeof c === 'string' ? c : c.key);
	const byKey = new Map(columns.map((c) => [keyOf(c), c]));
	const ordered: any[] = [];

	// place keys that exist in order
	for (const k of order) {
		if (byKey.has(k)) {
			ordered.push(byKey.get(k));
			byKey.delete(k);
		}
	}
	// append any columns not listed (new fields, etc.)
	for (const c of byKey.values()) ordered.push(c);

	return ordered;
};
