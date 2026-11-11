import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { blankFreight, blankRequest } from '$lib/shipping/types';

const settings = vi.hoisted(() => ({}) as Record<string, string>);
vi.mock('$env/dynamic/private', () => ({ env: settings }));
let api: typeof import('./unishippers');
const request = () => ({ ...blankRequest('2026-11-12'), services: 'LTL' as const });
function quote(overrides: Record<string, unknown> = {}) {
	return {
		clientStatus: { success: true },
		response: {
			offerList: [
				{
					offerId: 'offer-1',
					primaryVendor: { scac: 'TEST', preferredName: 'Test Carrier' },
					totalOfferCost: null,
					totalOfferPrice: { value: 125.34, unit: 'USD' },
					offeredProductList: [
						{
							shopRQShipment: {
								timeInTransit: {
									transitDays: 3,
									estimatedDeliveryDate: '2026-11-17',
									serviceLevel: 'STANDARD'
								},
								handlingUnitList: [
									{ shippedItemList: [{ commodityClass: '55', updatedCommodityClass: '400' }] }
								]
							}
						}
					],
					...overrides
				}
			]
		}
	};
}
const response = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const token = (value = 'test-token') =>
	response({ access_token: value, token_type: 'Bearer', expires_in: 86400 });
const fetch = vi.fn<typeof globalThis.fetch>();
beforeEach(async () => {
	vi.resetModules();
	vi.resetAllMocks();
	Object.assign(settings, {
		UNISHIPPERS_CLIENT_ID: 'test-client',
		UNISHIPPERS_CLIENT_SECRET: 'test-secret',
		UNISHIPPERS_AUDIENCE: 'staging-wwex-apig',
		UNISHIPPERS_TOKEN_URL: 'https://auth.staging-wwex.com/oauth/token',
		UNISHIPPERS_API_BASE_URL: 'https://speedship.staging-wwex.com/svc'
	});
	vi.stubGlobal('fetch', fetch);
	api = await import('./unishippers');
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('Unishippers LTL adapter', () => {
	it('maps per-unit form weights to group totals and preserves dimensions, NMFC, stackability and accessorials', () => {
		const shipment = request();
		shipment.freight = [
			{ ...blankFreight(), quantity: 3, weight: 100, stackable: true },
			{ ...blankFreight(), quantity: 2, weight: 50 }
		];
		shipment.shipTo.residential = true;
		shipment.accessorials.deliveryLiftgate = true;
		shipment.accessorials.limitedAccessPickup = true;
		const body = api.unishippersRatePayload(shipment).request;
		expect(body.productType).toBe('LTL');
		expect(body.shipment).toMatchObject({
			shipmentDate: '2026-11-12 11:00:00',
			totalHandlingUnitCount: 5,
			totalWeight: { value: 400, unit: 'LB' },
			handlingCharge: { value: '0', unit: 'AMOUNT' },
			insuranceRequestFlag: false,
			residentialDeliveryFlag: true,
			liftgateDeliveryFlag: true,
			originAddress: { locationType: 'LIMITED_ACCESS' }
		});
		expect(body.shipment.handlingUnitList[0]).toMatchObject({
			quantity: 3,
			isStackable: true,
			weight: { value: 300, unit: 'LB' },
			billedDimension: { length: { value: '48', unit: 'in' } },
			shippedItemList: [
				{
					NMFCNbr: '153500-02',
					commodityClass: '300',
					commodityDescription: 'Tags and labels',
					quantity: '3',
					weight: { value: 300, unit: 'LB' }
				}
			]
		});
		expect(body.shipment.originAddress.address).not.toHaveProperty('contactList');
		expect(body.shipment.handlingUnitList[1].shippedItemList[0].commodityClass).toBe('400');
		// Legacy saved/form classes never override the server's density calculation.
		shipment.freight[0].freightClass = '55';
		expect(
			api.unishippersRatePayload(shipment).request.shipment.handlingUnitList[0].shippedItemList[0]
				.commodityClass
		).toBe('300');
	});
	it('uses the inclusive account offer total, preserves transit/reference data, and flags calculated classes', () => {
		const rates = api.normalizeUnishippersRates(quote(), true, ['55']);
		expect(rates).toEqual([
			expect.objectContaining({
				service: 'LTL',
				provider: 'Unishippers',
				carrier: 'Test Carrier',
				code: 'TEST',
				costCents: 12534,
				currency: 'USD',
				staging: true,
				freightClass: '55',
				transitDays: 3,
				estimatedDeliveryDate: '2026-11-17',
				providerReference: 'offer-1'
			})
		]);
		expect(rates[0].classificationWarning).toContain('calculated class 400');
	});
	it('rejects missing, failed, empty, unsupported-currency and invalid-priced offers instead of inventing zero costs', () => {
		for (const body of [
			null,
			{ clientStatus: { success: false } },
			{ clientStatus: { success: true }, response: { offerList: [] } },
			quote({ totalOfferPrice: null }),
			quote({ totalOfferPrice: { value: 125.34, unit: 'EUR' } }),
			quote({ totalOfferPrice: { value: 'NaN', unit: 'USD' } }),
			quote({ totalOfferPrice: { value: -1, unit: 'USD' } }),
			quote({ primaryVendor: null })
		])
			expect(() => api.normalizeUnishippersRates(body, true, ['55'])).toThrow();
	});
	it('shares a single authentication request across concurrent quotes and caches the token', async () => {
		fetch.mockImplementation(async (url) =>
			String(url).endsWith('/oauth/token') ? token() : response(quote())
		);
		await Promise.all([
			api.getUnishippersShippingRates(request()),
			api.getUnishippersShippingRates(request())
		]);
		expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/oauth/token'))).toHaveLength(
			1
		);
		expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/shopFlow'))).toHaveLength(2);
		const auth = fetch.mock.calls[0][1]!;
		expect(auth.body).toBeInstanceOf(URLSearchParams);
		expect((auth.body as URLSearchParams).get('audience')).toBe('staging-wwex-apig');
		await api.getUnishippersShippingRates(request());
		expect(fetch).toHaveBeenCalledTimes(4);
		expect(fetch.mock.calls.at(-1)?.[1]?.headers).toMatchObject({
			Authorization: 'Bearer test-token'
		});
	});
	it('refreshes near-expired tokens and invalidates the cache when credentials change', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(0);
		fetch.mockImplementation(async (url) =>
			String(url).endsWith('/oauth/token') ? token() : response(quote())
		);
		await api.getUnishippersShippingRates(request());
		vi.setSystemTime(86400_000 - 30_000);
		await api.getUnishippersShippingRates(request());
		settings.UNISHIPPERS_CLIENT_SECRET = 'replacement-secret';
		await api.getUnishippersShippingRates(request());
		expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/oauth/token'))).toHaveLength(
			3
		);
	});
	it('retries an expired bearer token once and does not loop on repeated denials', async () => {
		fetch
			.mockResolvedValueOnce(token('first'))
			.mockResolvedValueOnce(response({}, 401))
			.mockResolvedValueOnce(token('second'))
			.mockResolvedValueOnce(response(quote()));
		expect(await api.getUnishippersShippingRates(request())).toHaveLength(1);
		expect(fetch).toHaveBeenCalledTimes(4);
		expect(fetch.mock.calls.at(-1)?.[1]?.headers).toMatchObject({ Authorization: 'Bearer second' });
		fetch
			.mockResolvedValueOnce(response({}, 401))
			.mockResolvedValueOnce(token('third'))
			.mockResolvedValueOnce(response({ error: 'private-secret' }, 401));
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow(
			'Unishippers denied access'
		);
		expect(fetch).toHaveBeenCalledTimes(7);
	});
	it('fails safely for missing settings, malformed auth, HTTP errors and provider error bodies', async () => {
		settings.UNISHIPPERS_CLIENT_SECRET = '';
		expect(api.unishippersStatus().configured).toBe(false);
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow('not configured');
		expect(fetch).not.toHaveBeenCalled();
		settings.UNISHIPPERS_CLIENT_SECRET = 'test-secret';
		fetch.mockResolvedValueOnce(response({ error_description: 'private-secret' }, 401));
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow(
			'Unishippers authentication failed'
		);
		fetch.mockResolvedValueOnce(response({ access_token: 'bad', expires_in: 86400 }));
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow(
			'invalid authentication response'
		);
		fetch
			.mockResolvedValueOnce(token())
			.mockResolvedValueOnce(response({ message: 'private-secret' }, 422));
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow(
			'Check the shipment details'
		);
		fetch.mockResolvedValueOnce(
			response({ clientStatus: { success: false, message: 'private-secret' } })
		);
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow('Check the addresses');
	});
	it('rejects insecure connection settings before transmitting credentials', async () => {
		settings.UNISHIPPERS_TOKEN_URL = 'http://auth.staging-wwex.com/oauth/token';
		await expect(api.getUnishippersShippingRates(request())).rejects.toThrow('HTTPS');
		expect(fetch).not.toHaveBeenCalled();
	});
});
