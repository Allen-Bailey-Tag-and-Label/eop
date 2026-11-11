import { describe, expect, it } from 'vitest';
import { shippingResultOptions, shippingResultServices } from './results';
import { blankRequest, type QuoteView, type PricedRate } from './types';
import type { QuoteScenario } from '$lib/ups/quote';

function scenario(id: string, unitQuantity: number): QuoteScenario {
	return {
		id,
		label: '',
		unitQuantity,
		services: ['03', '12'],
		weightMode: 'total',
		packageTotalCount: 2,
		packageTotalWeight: 20,
		packageWeight: 10,
		packageGroups: [{ quantity: 2, weight: 10 }],
		status: 'complete',
		rates: [],
		unavailableServices: ['12'],
		message: ''
	};
}
const rate: PricedRate = {
	service: 'UPS',
	provider: 'UPS',
	carrier: 'UPS',
	code: '03',
	description: 'Ground',
	currency: 'USD',
	costCents: 10000,
	priceCents: 12500,
	rateBasis: 'negotiated',
	markup: {
		ruleId: null,
		label: 'Original markup',
		revision: 2,
		percentBps: 2500,
		amountCents: 2500
	}
};
function quote(): QuoteView {
	const request = {
		...blankRequest('2026-11-11'),
		services: 'Both' as const,
		upsScenarios: [scenario('first', 10000), scenario('second', 20000)]
	};
	return {
		number: '123',
		origin: 'shipping',
		createdAt: null,
		branchId: '',
		request,
		shipFrom: request.shipFrom,
		shipTo: request.shipTo,
		legacyRates: [],
		rates: [
			{ ...rate, scenarioId: 'first' },
			{ ...rate, scenarioId: 'second', priceCents: 23000 },
			{
				...rate,
				service: 'LTL',
				provider: 'Unishippers',
				carrier: 'Test freight',
				priceCents: 40000
			}
		],
		attempts: [
			{ service: 'UPS', status: 'success', message: '' },
			{ service: 'LTL', status: 'success', message: '' }
		]
	};
}
describe('saved shipping results', () => {
	it('keeps separate LTL offers from the same carrier instead of collapsing their prices', () => {
		const input = quote();
		const freight = input.rates.find((rate) => rate.service === 'LTL')!;
		input.rates = [
			{ ...freight, providerReference: 'standard' },
			{ ...freight, providerReference: 'guaranteed', priceCents: 45000 }
		];
		expect(shippingResultOptions(input).at(-1)?.rates).toEqual([
			{ serviceCode: 'LTL:standard', rate: 400 },
			{ serviceCode: 'LTL:guaranteed', rate: 450 }
		]);
		expect(
			shippingResultServices(input).filter((service) => service.code.startsWith('LTL:'))
		).toHaveLength(2);
	});
	it('maps each quantity to its saved customer prices and separates UPS/LTL codes', () => {
		const input = quote();
		const options = shippingResultOptions(input);
		expect(options).toHaveLength(3);
		expect(options[0]).toMatchObject({
			id: 'first',
			unitQuantity: 10000,
			services: ['UPS:03', 'UPS:12'],
			rates: [{ serviceCode: 'UPS:03', rate: 125 }]
		});
		expect(options[1].rates).toEqual([{ serviceCode: 'UPS:03', rate: 230 }]);
		expect(options[2]).toMatchObject({
			id: 'ltl',
			services: ['LTL:03:Ground'],
			rates: [{ serviceCode: 'LTL:03:Ground', rate: 400 }]
		});
		expect(shippingResultServices(input)).toContainEqual({ code: 'UPS:03', title: 'UPS Ground' });
		expect(shippingResultServices(input)).toContainEqual({
			code: 'LTL:03:Ground',
			title: 'Test freight - Ground'
		});
	});
	it('retains a failed provider without losing successful quantity prices', () => {
		const input = quote();
		input.attempts[1].status = 'error';
		input.rates = input.rates.filter((rate) => rate.service === 'UPS');
		const options = shippingResultOptions(input);
		expect(options[0].rates[0].rate).toBe(125);
		expect(options[2]).toMatchObject({ status: 'failed', rates: [] });
	});
	it('does not invent quantity options for historical quotes or mutate their saved prices', () => {
		const input = {
			...quote(),
			origin: 'legacy-ups' as const,
			request: null,
			rates: [],
			legacyRates: [{ description: 'Ground', priceCents: 12345 }]
		};
		expect(shippingResultOptions(input)).toEqual([]);
		expect(input.legacyRates[0].priceCents).toBe(12345);
	});
});
