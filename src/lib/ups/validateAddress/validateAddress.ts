import { proxyFetch } from '$lib/proxyFetch';
import { getAccessToken } from '../';

type Address = {
	address: string;
	city: string;
	state: string;
	zip: string | number;
	country?: string;
};

export const validateAddress = async (address: Address) => {
	if (typeof address.zip === 'number') address.zip = address.zip.toString();

	const token = await getAccessToken();

	const response = await proxyFetch('https://onlinetools.ups.com/addressvalidation/v2/validate', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			XAVRequest: {
				AddressKeyFormat: {
					AddressLine: [address.address],
					PoliticalDivision2: address.city,
					PoliticalDivision1: address.state,
					PostcodePrimaryLow: address.zip,
					CountryCode: address.country ?? 'US'
				}
			}
		})
	});

	const result = await response.json();

	return result;
};
