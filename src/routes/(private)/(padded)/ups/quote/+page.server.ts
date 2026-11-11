export const load = async ({ url }) => {
	const searchParams = Object.fromEntries(url.searchParams);
	return {
		_branchId: searchParams._branchId ?? '',
		isValidated: searchParams.isValidated ?? 'true',
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
