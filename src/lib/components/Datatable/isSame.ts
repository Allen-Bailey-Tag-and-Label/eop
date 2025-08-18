import { getAt, normalizeHtmlToText } from './';

export const isSame = (a: any, b: any, path: string | null = null) => {
	if (path) {
		a = getAt(a, path);
		b = getAt(b, path);
	}

	if (typeof a === 'string') a = normalizeHtmlToText(a);
	if (typeof b === 'string') b = normalizeHtmlToText(b);
	if (a === '') a = undefined;
	if (b === '') b = undefined;

	if (Object.is(a, b)) return true;
	if (typeof a !== typeof b) return false;
	if (a instanceof Date) return a.getTime() === b.getTime();
	if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b);
	return a === b;
};
