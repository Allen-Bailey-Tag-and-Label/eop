import type { Actions } from '@sveltejs/kit';
import { UPS_ACCESSLICENSE_NUMBER, UPS_PASSWORD, UPS_USERNAME } from '$env/static/private';
import { proxyFetch } from '$lib/proxyFetch';
import { type Candidate } from './types';

export const actions: Actions = {
	default: async ({ request }) => {
		const {
			address: AddressLine,
			city: PoliticalDivision2,
			state: PoliticalDivision1,
			zip: PostcodePrimaryLow
		} = <Record<string, string>>Object.fromEntries(await request.formData());

		const upsHeaders = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			AccessLicenseNumber: UPS_ACCESSLICENSE_NUMBER,
			Password: UPS_PASSWORD,
			Username: UPS_USERNAME
		};

		const upsBody = JSON.stringify({
			XAVRequest: {
				AddressKeyFormat: {
					AddressLine: [AddressLine],
					PoliticalDivision2,
					PoliticalDivision1,
					PostcodePrimaryLow,
					CountryCode: 'US'
				}
			}
		});

		const response = await proxyFetch('https://onlinetools.ups.com/addressvalidation/v1/3', {
			method: 'POST',
			headers: upsHeaders,
			body: upsBody
		});

		const {
			XAVResponse: { Candidate }
		}: { XAVResponse: { Candidate: Candidate[] } } = await response.json();

		return Candidate;
	}
};
