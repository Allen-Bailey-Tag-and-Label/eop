import { describe, expect, it } from 'vitest';
import { calculateCases } from './casePacking';
const packing = {
	unitsPerCarton: 2500,
	cartonWeight: 20,
	tareWeight: 2,
	partialCase: 'prorate' as const
};
describe('case quantity calculations', () => {
	it('calculates complete cases for 10,000, 20,000 and 30,000 units', () => {
		expect(
			[10000, 20000, 30000].map((units) => calculateCases(units, packing).packageTotalCount)
		).toEqual([4, 8, 12]);
		expect(
			[10000, 20000, 30000].map((units) => calculateCases(units, packing).packageTotalWeight)
		).toEqual([80, 160, 240]);
	});
	it('adds the carton tare after prorating the contents of a partial case', () => {
		expect(calculateCases(11000, packing)).toEqual({
			packageGroups: [
				{ quantity: 4, weight: 20 },
				{ quantity: 1, weight: 9.2 }
			],
			packageTotalCount: 5,
			packageTotalWeight: 89.2
		});
	});
	it('can charge a full carton weight for partial cases', () => {
		expect(calculateCases(11000, { ...packing, partialCase: 'full' }).packageTotalWeight).toBe(100);
	});
	it.each([
		{ units: 0, values: packing },
		{ units: 1.5, values: packing },
		{ units: 10000, values: { ...packing, unitsPerCarton: 0 } },
		{ units: 10000, values: { ...packing, cartonWeight: 151 } },
		{ units: 10000, values: { ...packing, tareWeight: 21 } },
		{ units: 10000, values: { ...packing, tareWeight: -1 } },
		{ units: 127500, values: packing }
	])('rejects invalid quantities, weights and oversized requests: %j', ({ units, values }) => {
		expect(() => calculateCases(units, values)).toThrow();
	});
});
