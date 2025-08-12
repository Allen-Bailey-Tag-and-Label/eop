import { getAt } from './getAt';

export const isSame = (a: any, b: any, path = null) => {
	if (path) {
		a = getAt(a, path);
		b = getAt(b, path);
	}
	if (Object.is(a, b)) return true;
	if (typeof a !== typeof b) return false;
	if (a instanceof Date) return a.getTime() === b.getTime();
	if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b);
	return a === b;
};
