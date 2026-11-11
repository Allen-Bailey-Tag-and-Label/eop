import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRates } from './getRates';
vi.mock('../', () => ({ getAccessToken: vi.fn(async () => 'test-token') }));
afterEach(() => vi.unstubAllGlobals());
describe('UPS package payload', () => {
	it('sends one actual package entry for each supplied weight', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(
			async () =>
				new Response(JSON.stringify({ RateResponse: { RatedShipment: [] } }), {
					headers: { 'Content-Type': 'application/json' }
				})
		);
		vi.stubGlobal('fetch', fetch);
		const address = { address: '1 Main', city: 'Caledonia', state: 'NY', zip: '14423' };
		await getRates(address, address, [{ weight: 10 }, { weight: 20 }]);
		const options = fetch.mock.calls[0][1] as RequestInit;
		const body = JSON.parse(String(options.body));
		expect(
			body.RateRequest.Shipment.Package.map(
				(item: { PackageWeight: { Weight: string } }) => item.PackageWeight.Weight
			)
		).toEqual(['10', '20']);
	});
	it('retains support for existing single-package callers', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(
			async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } })
		);
		vi.stubGlobal('fetch', fetch);
		const address = { address: '1 Main', city: 'Caledonia', state: 'NY', zip: '14423' };
		await getRates(address, address, { weight: 7.25 });
		const body = JSON.parse(String((fetch.mock.calls[0][1] as RequestInit).body));
		expect(body.RateRequest.Shipment.Package).toHaveLength(1);
		expect(body.RateRequest.Shipment.Package[0].PackageWeight.Weight).toBe('7.25');
	});
});
