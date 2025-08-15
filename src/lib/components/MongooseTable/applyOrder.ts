import { columnKey } from './';

export const applyOrder = (merged: any[], order: string[]) => {
	if (!order?.length) return merged;
	const byKey = new Map(merged.map((column) => [columnKey(column), column]));
	const used = new Set<string>();
	const ordered: any[] = [];

	// place items that exist in 'order'
	for (const key of order) {
		const column = byKey.get(key);
		if (column) {
			ordered.push(column);
			used.add(key);
		}
	}

	// append any remaining columns in their original relative order
	for (const column of merged) {
		const key = columnKey(column);
		if (!used.has(key)) ordered.push(column);
	}
	return ordered;
};
