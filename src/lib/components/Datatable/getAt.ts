export const getAt = (obj: any, path: string) => {
	if (!path || obj == null) return undefined;
	if (!path.includes('.')) return obj?.[path] ?? undefined;
	return path.split('.').reduce<any>((cur, key) => {
		if (cur == null || typeof cur !== 'object') return undefined;
		return cur[key];
	}, obj);
};
