import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { actions } from '../../../routes/(private)/(padded)/shipping/quote/+page.server';
import { createShippingQuote } from './quotes';
import { blankRateScenario } from '$lib/ups/quote';
import { blankShippingScenario } from '$lib/shipping/packing';

vi.mock('$lib/server/mongoose/connect', () => ({ connect: vi.fn(async () => {}) }));
vi.mock('./quotes', () => ({
	createShippingQuote: vi.fn(async () => '1502'),
	findShippingQuote: vi.fn()
}));

const submit = actions.default!;
function fields() {
	const result = new FormData();
	for (const [key, value] of Object.entries({
		_branchId: 'a'.repeat(24),
		requestId: crypto.randomUUID(),
		services: 'UPS',
		isValidated: 'true',
		shipFromAddress: '3177 Lehigh Street',
		shipFromCity: 'Caledonia',
		shipFromState: 'NY',
		shipFromZIP: '14423',
		shipToAddress: '10 Main St',
		shipToCity: 'Holtsville',
		shipToState: 'NY',
		shipToZIP: '501'
	}))
		result.set(key, value);
	result.set(
		'rateScenarios',
		JSON.stringify([{ ...blankRateScenario(), totalPackages: '2', totalWeight: '25' }])
	);
	return result;
}
function event(body: FormData) {
	return {
		request: new Request('https://eop.example/shipping/quote', { method: 'POST', body }),
		locals: { user: { _id: 'b'.repeat(24), branches: [{ _id: 'a'.repeat(24) }] } }
	};
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-11-12T01:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('shipping shared form submission', () => {
	it('normalizes shared packing for all quantities and validates later LTL rows before requesting rates', async () => {
		const first = { ...blankShippingScenario(), totalPackages: '20', totalWeight: '1000' };
		first.shipping!.palletCount = '2';
		const second = { ...blankShippingScenario(), totalPackages: '40', totalWeight: '2000' };
		second.shipping!.palletCount = '4';
		const body = fields();
		body.delete('rateScenarios');
		body.set('services', 'Both');
		body.set('shippingScenarios', JSON.stringify([first, second]));
		await expect(submit(event(body) as never)).rejects.toMatchObject({ status: 303 });
		const saved = vi.mocked(createShippingQuote).mock.calls[0][0];
		expect(saved.upsScenarios?.map((scenario) => scenario.packageTotalWeight)).toEqual([
			1000, 2000
		]);
		expect(
			saved.ltlScenarios?.map((scenario) =>
				scenario.freight.reduce((sum, item) => sum + item.quantity * item.weight, 0)
			)
		).toEqual([1000, 2000]);
		expect(saved.packingInputs).toHaveLength(2);
		vi.mocked(createShippingQuote).mockClear();
		second.shipping!.height = '0';
		body.set('shippingScenarios', JSON.stringify([first, second]));
		expect(await submit(event(body) as never)).toMatchObject({ status: 400 });
		expect(createShippingQuote).not.toHaveBeenCalled();
	});
	it('submits Both with an NMFC-only LTL item and no freight class or commodity description', async () => {
		const body = fields();
		body.set('services', 'Both');
		body.append('freightId', 'freight-1');
		for (const [key, value] of Object.entries({
			quantity: '1',
			weight: '100',
			length: '48',
			width: '40',
			height: '48',
			nmfc: '153500-02'
		}))
			body.set('freight.freight-1.' + key, value);
		await expect(submit(event(body) as never)).rejects.toMatchObject({ status: 303 });
		expect(createShippingQuote).toHaveBeenCalledWith(
			expect.objectContaining({
				services: 'Both',
				freight: [expect.objectContaining({ nmfc: '153500-02', description: '', freightClass: '' })]
			}),
			expect.any(String),
			expect.any(String),
			true
		);
	});
	it('parses the real UPS controls and assigns the current business date without a date input', async () => {
		await expect(submit(event(fields()) as never)).rejects.toMatchObject({
			status: 303,
			location: '/shipping/quotes/1502'
		});
		expect(createShippingQuote).toHaveBeenCalledWith(
			expect.objectContaining({
				branchId: 'a'.repeat(24),
				shipDate: '2026-11-11',
				customer: '',
				reference: '',
				validateAddresses: true,
				shipTo: expect.objectContaining({ zip: '00501', residential: false }),
				packages: [expect.objectContaining({ quantity: 2, weight: 12.5 })],
				upsScenarios: [expect.objectContaining({ weightMode: 'total', packageTotalCount: 2 })]
			}),
			expect.any(String),
			'b'.repeat(24),
			true
		);
	});
	it('rejects invalid scenarios or empty ZIPs and respects Validation No', async () => {
		const invalid = fields();
		invalid.set('rateScenarios', '{}');
		expect(await submit(event(invalid) as never)).toMatchObject({ status: 400 });
		invalid.set('rateScenarios', fields().get('rateScenarios')!);
		invalid.set('shipToZIP', '');
		expect(await submit(event(invalid) as never)).toMatchObject({ status: 400 });
		expect(createShippingQuote).not.toHaveBeenCalled();
		const skipped = fields();
		skipped.set('isValidated', 'false');
		skipped.set('shipToAddress', '');
		await expect(submit(event(skipped) as never)).rejects.toMatchObject({ status: 303 });
		expect(createShippingQuote).toHaveBeenCalledWith(
			expect.objectContaining({
				validateAddresses: false,
				shipTo: expect.objectContaining({ address: '' })
			}),
			expect.any(String),
			expect.any(String),
			true
		);
	});
});
