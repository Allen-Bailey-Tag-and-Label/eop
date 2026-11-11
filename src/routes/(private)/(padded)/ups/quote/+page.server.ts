import { connect } from '$lib/server/mongoose';
import { findUpsQuote } from '$lib/server/ups/quotes';
import type { PageServerLoad } from './$types';
import type { PackageGroupInput, WeightMode } from '$lib/ups/quote';

export const load: PageServerLoad = async ({ url }) => {
	const searchParams = Object.fromEntries(url.searchParams);
	if (searchParams.from) {
		await connect();
		const source = await findUpsQuote(searchParams.from);
		const address = (value: typeof source.shipper) => ({
			address: value.AddressLine,
			city: value.City,
			state: value.StateProvinceCode,
			zip: value.PostalCode
		});
		return {
			_branchId: source._branchId,
			isValidated: String(
				source.generation ? source.generation.validation !== 'skipped' : source.isValidated
			),
			formData: {
				shipFrom: address(source.shipper),
				shipTo: address(source.shipTo),
				packageInfo: {
					totalPackages: String(source.packageTotalCount),
					totalWeight: String(source.packageTotalWeight)
				}
			},
			weights: {
				mode: source.weightMode ?? 'total',
				eachWeight:
					source.weightMode === 'each' ? String(source.packageGroups?.[0]?.weight ?? '') : '',
				groups: (source.packageGroups ?? []).map((group) => ({
					id: crypto.randomUUID(),
					quantity: String(group.quantity),
					weight: String(group.weight)
				}))
			}
		};
	}
	return {
		_branchId: searchParams._branchId ?? '',
		isValidated: searchParams.isValidated ?? 'true',
		weights: { mode: 'total' as WeightMode, eachWeight: '', groups: [] as PackageGroupInput[] },
		formData: {
			shipFrom: {
				address: '3177 Lehigh Street',
				city: 'Caledonia',
				state: 'NY',
				zip: '14423'
			},
			shipTo: {
				address: searchParams.address ?? '',
				city: searchParams.city ?? '',
				state: searchParams.state ?? '',
				zip: searchParams.zip ?? ''
			},
			packageInfo: {
				totalPackages: searchParams.totalPackages ?? '',
				totalWeight: searchParams.totalWeight ?? ''
			}
		}
	};
};
