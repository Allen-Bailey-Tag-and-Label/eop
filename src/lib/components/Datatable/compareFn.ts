import { is } from '$lib/is';

export const compareFn = {
	bigint: (a: bigint, b: bigint) => {
		if (typeof a !== 'bigint' || typeof b !== 'bigint') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return BigInt('0');
	},
	boolean: (a: boolean, b: boolean) => {
		if (typeof a !== 'boolean' || typeof b !== 'boolean') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		if (a === b) return 0;
		if (a) return -1;
		return 1;
	},
	currency: (a: number, b: number) => {
		if (typeof a !== 'number' || typeof b !== 'number') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return a - b;
	},
	function: (a: Function, b: Function) => {
		if (typeof a !== 'function' || typeof b !== 'function') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return 0;
	},
	number: (a: number, b: number) => {
		if (typeof a !== 'number' || typeof b !== 'number') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return a - b;
	},
	object: (a: object, b: object) => {
		if (typeof a !== 'object' || typeof b !== 'object') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return 0;
	},
	string: (a: string, b: string) => {
		if (typeof a !== 'string' || typeof b !== 'string') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return a.localeCompare(b);
	},
	symbol: (a: symbol, b: symbol) => {
		if (typeof a !== 'symbol' || typeof b !== 'symbol') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return 0;
	},
	timestamp: (a: Date, b: Date) => {
		console.log(a);
		if (!is.date(a) || !is.date(b)) return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return a.getTime() - b.getTime();
	},
	undefined: (a: undefined, b: undefined) => {
		if (typeof a !== 'undefined' || typeof b !== 'undefined') return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return 0;
	}
};
