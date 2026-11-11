import { describe, expect, it, vi } from 'vitest';
import { load } from '../../../routes/(private)/(padded)/ups/quote/+page.server';
import { findUpsQuote } from './quotes';
vi.mock('$lib/server/mongoose', () => ({ connect: vi.fn() }));
vi.mock('./quotes', () => ({ findUpsQuote: vi.fn() }));
describe('UPS quote duplication', () => {
	it('restores both addresses, validation choice, and unequal package groups', async () => {
		const address = {
			AddressLine: '1 Main',
			City: 'Caledonia',
			StateProvinceCode: 'NY',
			PostalCode: '14423',
			CountryCode: 'US'
		};
		vi.mocked(findUpsQuote).mockResolvedValue({
			quote: 1234,
			_branchId: 'b'.repeat(24),
			shipper: address,
			shipTo: { ...address, AddressLine: '3177 Lehigh' },
			packageTotalCount: 2,
			packageTotalWeight: 30,
			weightMode: 'groups',
			packageGroups: [
				{ quantity: 1, weight: 10 },
				{ quantity: 1, weight: 20 }
			],
			generation: { validation: 'pending', rates: 'pending' },
			isValidated: false
		} as never);
		const result = await load({ url: new URL('https://eop.example/ups/quote?from=1234') } as never);
		expect(result).toMatchObject({
			isValidated: 'true',
			formData: { shipFrom: { address: '1 Main' }, shipTo: { address: '3177 Lehigh' } },
			weights: {
				mode: 'groups',
				groups: [
					{ quantity: '1', weight: '10' },
					{ quantity: '1', weight: '20' }
				]
			}
		});
		expect(findUpsQuote).toHaveBeenCalledWith('1234');
	});
});
