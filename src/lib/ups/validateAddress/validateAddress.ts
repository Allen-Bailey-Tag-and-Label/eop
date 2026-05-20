import { getAccessToken, type Address } from '../';

export const validateAddress = async (address: Address) => {
	if (typeof address.zip === 'number') address.zip = address.zip.toString();

	const token = await getAccessToken();

	const response = await fetch('https://onlinetools.ups.com/api/addressvalidation/v2/3', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			transId: crypto.randomUUID(),
			transactionSrc: 'ennis-eop'
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
