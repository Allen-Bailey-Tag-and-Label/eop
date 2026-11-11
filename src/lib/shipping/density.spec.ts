import { describe, expect, it } from 'vitest';
import { freightDensity } from './density';
import { blankFreight } from './types';

describe('density freight classification', () => {
	const item = { ...blankFreight(), length: 12, width: 12, height: 12 };
	it.each([
		[0.5, '400'],
		[1, '300'],
		[2, '250'],
		[4, '175'],
		[6, '125'],
		[8, '100'],
		[10, '92.5'],
		[12, '85'],
		[15, '70'],
		[22.5, '65'],
		[30, '60'],
		[35, '55'],
		[50, '50']
	])('classifies %s PCF as class %s at the inclusive boundary', (density, freightClass) => {
		expect(freightDensity({ ...item, weight: Number(density) })?.freightClass).toBe(freightClass);
		if (Number(density) >= 1) {
			const previous = freightDensity({ ...item, weight: Number(density) - 0.00001 });
			expect(previous?.freightClass).not.toBe(freightClass);
		}
	});
	it('multiplies volume and weight for identical pallets without changing density or class', () => {
		const pallet = { ...item, length: 48, width: 40, height: 45, weight: 450 };
		expect(freightDensity(pallet)).toEqual({
			cubicFeet: 50,
			totalCubicFeet: 50,
			density: 9,
			freightClass: '100'
		});
		expect(freightDensity({ ...pallet, quantity: 3 })).toEqual({
			cubicFeet: 50,
			totalCubicFeet: 150,
			density: 9,
			freightClass: '100'
		});
	});
	it('rejects incomplete, nonfinite and nonpositive input instead of inventing a class', () => {
		for (const key of ['quantity', 'weight', 'length', 'width', 'height'])
			for (const value of [undefined, NaN, Infinity, 0, -1])
				expect(freightDensity({ ...item, [key]: value })).toBeNull();
		expect(freightDensity({ ...item, quantity: 1.5 })).toBeNull();
	});
});
