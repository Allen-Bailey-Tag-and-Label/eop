import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blankRequest } from '$lib/shipping/types';
import { validateAddress } from '$lib/ups/validateAddress/validateAddress';
import { validateShippingDestination } from './addresses';

vi.mock('$lib/ups/validateAddress/validateAddress', () => ({ validateAddress: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe('shipping address validation', () => {
	it('skips validation when No is selected or when reading an older request', async () => {
		const request = blankRequest('2026-11-11');
		expect(await validateShippingDestination(request)).toBe(request);
		expect(await validateShippingDestination({ ...request, validateAddresses: false })).toEqual({
			...request,
			validateAddresses: false
		});
		expect(validateAddress).not.toHaveBeenCalled();
	});
	it('uses the shared UPS validator and derives residential classification without a checkbox', async () => {
		const request = { ...blankRequest('2026-11-11'), validateAddresses: true };
		vi.mocked(validateAddress).mockResolvedValue({
			XAVResponse: {
				Candidate: [
					{
						AddressClassification: { Code: '2', Description: 'Residential' },
						AddressKeyFormat: {
							AddressLine: ['10 MAIN ST'],
							PoliticalDivision2: 'CALEDONIA',
							PoliticalDivision1: 'NY',
							PostcodePrimaryLow: '14423'
						}
					}
				]
			}
		});
		const result = await validateShippingDestination(request);
		expect(result.shipTo).toEqual({
			address: '10 MAIN ST',
			city: 'CALEDONIA',
			state: 'NY',
			zip: '14423',
			residential: true
		});
		expect(request.shipTo.address).toBe('');
		expect(validateAddress).toHaveBeenCalledWith(request.shipTo, expect.any(AbortSignal));
		vi.mocked(validateAddress).mockResolvedValue({
			XAVResponse: {
				Candidate: {
					AddressClassification: { Code: '1', Description: 'Commercial' },
					AddressKeyFormat: { AddressLine: 'OFFICE' }
				}
			}
		});
		expect((await validateShippingDestination(request)).shipTo.residential).toBe(false);
	});
	it('returns an actionable error for missing candidates or provider failures without leaking details', async () => {
		const request = { ...blankRequest('2026-11-11'), validateAddresses: true };
		vi.mocked(validateAddress).mockResolvedValue({ XAVResponse: {} });
		await expect(validateShippingDestination(request)).rejects.toThrow(
			'select No under Validation'
		);
		vi.mocked(validateAddress).mockRejectedValue(new Error('private-token'));
		await expect(validateShippingDestination(request)).rejects.toThrow('UPS could not validate');
	});
});
