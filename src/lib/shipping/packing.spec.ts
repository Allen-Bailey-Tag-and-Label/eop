import { describe, expect, it } from 'vitest';
import {
	blankShippingScenario,
	changePackingBasis,
	distributeWeight,
	packingInputsFromRequest,
	parsePackingScenarios
} from './packing';
import { blankRequest, blankFreight } from './types';

function row(service: 'UPS' | 'LTL' | 'Both' = 'Both') {
	return {
		...blankShippingScenario(service),
		totalPackages: service === 'LTL' ? '2' : '20',
		totalWeight: '1000'
	};
}
const total = (groups: { quantity: number; weight: number }[]) =>
	Number(groups.reduce((sum, group) => sum + group.quantity * group.weight, 0).toFixed(3));
describe('shared shipping packing', () => {
	it('preserves multiple legacy pallet geometries when linked to UPS and when changing basis', () => {
		const old = {
			...blankRequest('2026-11-11'),
			services: 'Both' as const,
			packages: [{ id: 'box', quantity: 20, weight: 50 }],
			freight: [
				{ ...blankFreight(), quantity: 1, weight: 500, width: 40 },
				{ ...blankFreight(), quantity: 1, weight: 500, width: 60 }
			]
		};
		const input = packingInputsFromRequest(old)[0];
		expect(
			parsePackingScenarios([input], 'Both').ltlScenarios[0].freight.map((item) => item.width)
		).toEqual([40, 60]);
		changePackingBasis(input, 'LTL');
		expect(
			parsePackingScenarios([input], 'Both').ltlScenarios[0].freight.map((item) => item.width)
		).toEqual([40, 60]);
		changePackingBasis(input, 'UPS');
		expect(
			parsePackingScenarios([input], 'Both').ltlScenarios[0].freight.map((item) => item.width)
		).toEqual([40, 60]);
	});
	it('shares total weight across independent UPS/carton and LTL/pallet counts', () => {
		const input = row();
		input.shipping!.palletCount = '2';
		const parsed = parsePackingScenarios(JSON.stringify([input]), 'Both');
		expect(parsed.upsScenarios[0].packageGroups).toEqual([{ quantity: 20, weight: 50 }]);
		expect(parsed.ltlScenarios[0].freight).toMatchObject([
			{ quantity: 2, weight: 500, nmfc: '153500-02', length: 48 }
		]);
		expect(total(parsed.ltlScenarios[0].freight)).toBe(total(parsed.upsScenarios[0].packageGroups));
	});
	it('preserves exact thousandths without rounding up the total for either provider', () => {
		expect(distributeWeight(10, 3)).toEqual([
			{ quantity: 2, weight: 3.333 },
			{ quantity: 1, weight: 3.334 }
		]);
		const input = row();
		input.totalPackages = '3';
		input.totalWeight = '10';
		input.shipping!.palletCount = '2';
		const parsed = parsePackingScenarios([input], 'Both');
		expect(total(parsed.upsScenarios[0].packageGroups)).toBe(10);
		expect(total(parsed.ltlScenarios[0].freight)).toBe(10);
	});
	it.each(['each', 'groups', 'cartons'] as const)(
		'supports the %s entry mode for LTL above UPS weight limits',
		(weightMode) => {
			const input = row('LTL');
			input.weightMode = weightMode;
			input.eachWeight = '500';
			input.groups = [{ id: 'g', quantity: '2', weight: '500' }];
			input.unitQuantity = '20000';
			input.unitsPerCarton = '10000';
			input.cartonWeight = '500';
			const parsed = parsePackingScenarios([input], 'LTL');
			expect(parsed.upsScenarios).toHaveLength(0);
			expect(total(parsed.ltlScenarios[0].freight)).toBe(1000);
		}
	);
	it('accepts separate dimensions for different pallet weight groups', () => {
		const input = row('LTL');
		input.weightMode = 'groups';
		input.groups = [
			{ id: 'a', quantity: '1', weight: '500' },
			{ id: 'b', quantity: '1', weight: '700' }
		];
		input.shipping!.shapes = {
			b: { length: '60', width: '42', height: '55', nmfc: '153500-02', stackable: true }
		};
		const parsed = parsePackingScenarios([input], 'LTL');
		expect(parsed.ltlScenarios[0].freight[0].length).toBe(48);
		expect(parsed.ltlScenarios[0].freight[1]).toMatchObject({
			length: 60,
			width: 42,
			height: 55,
			weight: 700,
			stackable: true
		});
	});
	it('retains independent quantities and shared totals across Advanced rows', () => {
		const first = row(),
			second = row();
		first.shipping!.palletCount = '1';
		second.shipping!.palletCount = '2';
		first.unitQuantity = '10000';
		second.unitQuantity = '20000';
		second.totalPackages = '40';
		second.totalWeight = '2000';
		const parsed = parsePackingScenarios([first, second], 'Both');
		expect(parsed.ltlScenarios.map((scenario) => total(scenario.freight))).toEqual([1000, 2000]);
		expect(parsed.upsScenarios.map((scenario) => scenario.packageTotalWeight)).toEqual([
			1000, 2000
		]);
		expect(parsed.ltlScenarios.map((scenario) => scenario.id)).toEqual(
			parsed.upsScenarios.map((scenario) => scenario.id)
		);
	});
	it('switches the entry basis without requiring the total weight again', () => {
		const input = row();
		input.shipping!.palletCount = '2';
		changePackingBasis(input, 'LTL');
		expect(input.totalPackages).toBe('2');
		expect(input.totalWeight).toBe('1000');
		expect(input.shipping!.packageCount).toBe('20');
		const parsed = parsePackingScenarios([input], 'Both');
		expect(total(parsed.upsScenarios[0].packageGroups)).toBe(total(parsed.ltlScenarios[0].freight));
		changePackingBasis(input, 'UPS');
		expect(input.totalPackages).toBe('20');
	});
	it('does not reuse pallet-specific group or case weights as UPS package weights', () => {
		const input = row('LTL');
		input.shipping!.packageCount = '20';
		input.weightMode = 'groups';
		input.groups = [{ id: 'pallet', quantity: '2', weight: '500' }];
		input.cartonWeight = '500';
		input.unitsPerCarton = '10000';
		changePackingBasis(input, 'UPS');
		expect(input.totalWeight).toBe('1000');
		expect(input.groups).toEqual([]);
		expect(input.eachWeight).toBe('50');
		expect(input.cartonWeight).toBe('');
		input.weightMode = 'each';
		expect(parsePackingScenarios([input], 'Both').upsScenarios[0].packageTotalWeight).toBe(1000);
	});
	it('rejects missing secondary counts, overweight UPS packages, mismatched services and duplicate IDs', () => {
		const input = row();
		expect(() => parsePackingScenarios([input], 'Both')).toThrow();
		input.shipping!.palletCount = '2';
		input.totalPackages = '2';
		expect(() => parsePackingScenarios([input], 'Both')).toThrow();
		input.totalPackages = '20';
		expect(() => parsePackingScenarios([input], 'LTL')).toThrow();
		expect(() => parsePackingScenarios([input, input], 'Both')).toThrow();
	});
	it('rejects malformed numeric fields and reserved group IDs with validation errors', () => {
		const input = row('LTL');
		input.weightMode = 'groups';
		input.groups = [{ id: 'valid', quantity: '1', weight: '500' }];
		const malformed = JSON.parse(JSON.stringify(input));
		malformed.groups[0].weight = { toString: 'not callable' };
		expect(() => parsePackingScenarios([malformed], 'LTL')).toThrow('group weight');
		malformed.groups[0] = { id: '__proto__', quantity: '1', weight: '500' };
		expect(() => parsePackingScenarios([malformed], 'LTL')).toThrow('group IDs');
	});
	it('returns validation errors for invalid pallet case/tare settings rather than server errors', () => {
		const input = row('LTL');
		input.weightMode = 'cartons';
		input.unitQuantity = '20000';
		input.unitsPerCarton = '10000';
		input.cartonWeight = '500';
		input.tareWeight = '501';
		try {
			parsePackingScenarios([input], 'LTL');
			throw new Error('Expected validation failure');
		} catch (cause) {
			expect(cause).toMatchObject({ status: 400 });
		}
	});
	it('duplicates new saved packing with new row IDs and retains legacy LTL geometry', () => {
		const input = row();
		input.shipping!.palletCount = '1';
		const request = {
			...blankRequest('2026-11-11'),
			services: 'Both' as const,
			packingInputs: [input]
		};
		const copy = packingInputsFromRequest(request)[0];
		expect(copy.id).not.toBe(input.id);
		expect(copy.totalWeight).toBe('1000');
		copy.shipping!.nmfc = 'changed';
		expect(input.shipping!.nmfc).toBe('153500-02');
		const legacy = packingInputsFromRequest({
			...blankRequest('2026-11-11'),
			services: 'LTL',
			freight: [{ ...blankFreight(), width: 55, weight: 600 }]
		});
		expect(parsePackingScenarios(legacy, 'LTL').ltlScenarios[0].freight[0]).toMatchObject({
			width: 55,
			weight: 600
		});
	});
});
