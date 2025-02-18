import { UPS_ACCESS_LICENSE_NUMBER, UPS_PASSWORD, UPS_USERNAME } from '$env/static/private';
import type { Result, FormData } from './types.js';

export const actions = {
	default: async ({ request }) => {
		const { address, city, state, zip } = <FormData>Object.fromEntries(await request.formData());
		const response = await fetch('https://onlinetools.ups.com/addressvalidation/v1/3', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				AccessLicenseNumber: UPS_ACCESS_LICENSE_NUMBER,
				Username: UPS_USERNAME,
				Password: UPS_PASSWORD,
				'X-Requested-With': 'XMLHttpRequest'
			},
			body: JSON.stringify({
				XAVRequest: {
					AddressKeyFormat: {
						AddressLine: [address],
						PoliticalDivision2: city,
						PoliticalDivision1: state,
						PostcodePrimaryLow: zip,
						CountryCode: 'US'
					}
				}
			})
		});

		const { XAVResponse } = await response.json();

		const { candidates, indicator }: Result = {
			candidates: Array.isArray(XAVResponse.Candidate)
				? XAVResponse.Candidate
				: XAVResponse.NoCandidatesIndicator
					? []
					: [XAVResponse.Candidate],
			indicator: Array.isArray(XAVResponse.Candidate)
				? 'ambiguousAddress'
				: XAVResponse.Candidate
					? 'validAddress'
					: 'noCandidates'
		};

		return { candidates, indicator, success: true };
	}
};
