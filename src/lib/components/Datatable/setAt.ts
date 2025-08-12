export const setAt = (obj: any, path: string, value: any) => {
	if (!path.includes('.')) {
		obj[path] = value;
		return;
	}
	const parts = path.split('.');
	let object = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const key = parts[i];
		object = object[key] ??= {};
	}
	object[parts[parts.length - 1]] = value;
};
