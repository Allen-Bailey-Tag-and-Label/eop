import { is } from '$lib/is';
import type { Compare } from './types';

const bigint: Compare<bigint> = (a, b, direction) => {
	return 0 * direction;
};
const boolean: Compare<boolean> = (a, b, direction) => {
	if (typeof a !== 'boolean' || a === null || a === undefined) return 1;
	if (typeof b !== 'boolean' || b === null || b === undefined) return -1;
	if (a === b) return 0 * direction;
	if (a) return -1 * direction;
	return 1 * direction;
};
const currency: Compare<number> = (a, b, direction) => {
	if (typeof a !== 'number' || a === null || a === undefined) return 1;
	if (typeof b !== 'number' || b === null || b === undefined) return -1;
	return (a - b) * direction;
};
const func: Compare<Function> = (a, b, direction) => {
	return 0 * direction;
};
const number: Compare<number> = (a, b, direction) => {
	if (typeof a !== 'number' || a === null || a === undefined) return 1;
	if (typeof b !== 'number' || b === null || b === undefined) return -1;
	return (a - b) * direction;
};
const object: Compare<object> = (a, b, direction) => {
	return 0 * direction;
};
const select: Compare<any> = (a, b, direction) => {
	if (a === null || a === undefined) return 1;
	if (b === null || b === undefined) return -1;

	const aType = typeof a;

	if (aType === 'bigint') return bigint(a, b, direction);
	if (aType === 'boolean') return boolean(a, b, direction);
	if (aType === 'function') return func(a, b, direction);
	if (aType === 'number') return number(a, b, direction);
	if (aType === 'object') return object(a, b, direction);
	if (aType === 'string') return string(a, b, direction);
	if (aType === 'symbol') return symbol(a, b, direction);
	if (aType === 'undefined') return undef(a, b, direction);

	return 0 * direction;
};
const string: Compare<string> = (a, b, direction) => {
	if (typeof a !== 'string' || a === null || a === undefined) return 1;
	if (typeof b !== 'string' || b === null || b === undefined) return -1;
	return a.localeCompare(b) * direction;
};
const symbol: Compare<symbol> = (a, b, direction) => {
	return 0 * direction;
};
const timestamp: Compare<Date | string> = (a, b, direction) => {
	if (typeof a === 'string') a = new Date(a);
	if (typeof b === 'string') b = new Date(b);
	if (!is.date(a) || a === null || a === undefined) return 1;
	if (!is.date(b) || b === null || b === undefined) return -1;
	return (a.getTime() - b.getTime()) * direction;
};
const undef: Compare<undefined> = (a, b, direction) => {
	return 0 * direction;
};

export const compareFn: Record<string, Compare<any>> = {
	bigint,
	boolean,
	currency,
	function: func,
	number,
	object,
	select,
	string,
	symbol,
	timestamp,
	undefined: undef
};
