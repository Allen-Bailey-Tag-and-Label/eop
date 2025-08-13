export const deleteAt = (obj: any, path: string) => {
	if (!obj || !path) return;
	if (!path.includes('.')) {
		delete obj[path];
		return;
	}
	const parts = path.split('.');
	const last = parts.pop()!;
	let cur = obj;
	for (const k of parts) {
		if (cur == null || typeof cur !== 'object') return;
		cur = cur[k];
	}
	if (cur && typeof cur === 'object') delete cur[last];
};
