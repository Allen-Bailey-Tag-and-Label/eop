import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankRequest } from '$lib/shipping/types';
import { getUpsShippingRates, normalizeUpsRates, upsRatePayload } from './ups';
import { getAccessToken } from '$lib/ups/getAccessToken/getAccessToken';
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/ups/getAccessToken/getAccessToken', () => ({
	getAccessToken: vi.fn(async () => 'private-token')
}));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});
describe('UPS shipping adapter', () => {
	it('sends one multi-package request with actual weights, dimensions, date, and account options', () => {
		const request = blankRequest('2026-11-10');
		request.shipTo.residential = true;
		request.packages[0].quantity = 2;
		request.packages.push({ ...request.packages[0], id: 'second', quantity: 1, weight: 25 });
		const body = upsRatePayload(request, 'account').RateRequest.Shipment;
		expect(body.Package).toHaveLength(3);
		expect(body.Package[2].PackageWeight.Weight).toBe('25');
		expect(body.Package[0].Dimensions.Length).toBe('12');
		expect(body.ShipTo.Address.ResidentialAddressIndicator).toBe('Y');
		expect(body.DeliveryTimeInformation.Pickup.Date).toBe('20261110');
		expect(body.Shipper.ShipperNumber).toBe('account');
		expect(upsRatePayload(request).RateRequest.Shipment.Shipper).not.toHaveProperty(
			'ShipperNumber'
		);
	});
	it('uses the negotiated shipment total when available and explicitly labels published fallback', () => {
		const rates = normalizeUpsRates({
			RateResponse: {
				RatedShipment: [
					{
						Service: { Code: '03' },
						TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '100.00' },
						NegotiatedRateCharges: { TotalCharge: { CurrencyCode: 'USD', MonetaryValue: '80.25' } }
					},
					{
						Service: { Code: '02' },
						TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '150.00' }
					}
				]
			}
		});
		expect(rates[0]).toMatchObject({
			costCents: 8025,
			rateBasis: 'negotiated',
			description: 'Ground'
		});
		expect(rates[1]).toMatchObject({ costCents: 15000, rateBasis: 'published' });
		expect(() => normalizeUpsRates({ RateResponse: { RatedShipment: [] } })).toThrow('no rates');
		expect(() =>
			normalizeUpsRates({
				RateResponse: {
					RatedShipment: {
						Service: { Code: '03' },
						TotalCharges: { CurrencyCode: 'EUR', MonetaryValue: '5' }
					}
				}
			})
		).toThrow('unsupported');
	});
	it('keeps OAuth and HTTP requests on the server and bounds them with a shared timeout signal', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue({
			ok: true,
			json: async () => ({
				RateResponse: {
					RatedShipment: {
						Service: { Code: '03' },
						TotalCharges: { CurrencyCode: 'USD', MonetaryValue: '10' }
					}
				}
			})
		} as Response);
		vi.stubGlobal('fetch', fetch);
		expect(await getUpsShippingRates(blankRequest('2026-11-10'))).toHaveLength(1);
		expect(fetch).toHaveBeenCalledWith(
			'https://onlinetools.ups.com/api/rating/v2409/Shop',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({ Authorization: 'Bearer private-token' }),
				signal: expect.any(AbortSignal)
			})
		);
		expect(getAccessToken).toHaveBeenCalledWith(fetch.mock.calls[0][1]?.signal);
		fetch.mockResolvedValueOnce({ ok: false } as never);
		await expect(getUpsShippingRates(blankRequest('2026-11-10'))).rejects.toThrow(
			'could not return rates'
		);
	});
});
