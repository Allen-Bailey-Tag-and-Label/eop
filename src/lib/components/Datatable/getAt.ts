export const getAt = (obj: any, path: string) => {
	if (!path.includes('.')) return obj?.[path];
	return path.split('.').reduce((object, key) => (object === null ? object : object[key]), obj);
};
