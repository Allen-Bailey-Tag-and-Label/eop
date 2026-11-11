import { validateAddress } from '$lib/ups/validateAddress/validateAddress';
import { ShippingError } from '$lib/shipping/validation';
import type { ShippingRequest } from '$lib/shipping/types';

export async function validateShippingDestination(
	request: ShippingRequest
): Promise<ShippingRequest> {
	if (!request.validateAddresses) return request;
	try {
		const result = await validateAddress({ ...request.shipTo }, AbortSignal.timeout(25_000));
		const candidates = result?.XAVResponse?.Candidate;
		const candidate = Array.isArray(candidates) ? candidates[0] : candidates;
		const address = candidate?.AddressKeyFormat;
		if (!address || !candidate.AddressClassification?.Description)
			throw new Error('No validated address.');
		const line = Array.isArray(address.AddressLine) ? address.AddressLine[0] : address.AddressLine;
		return {
			...request,
			shipTo: {
				...request.shipTo,
				address: line || request.shipTo.address,
				city: address.PoliticalDivision2 || request.shipTo.city,
				state: address.PoliticalDivision1 || request.shipTo.state,
				zip: address.PostcodePrimaryLow || request.shipTo.zip,
				residential:
					String(candidate.AddressClassification.Code) === '2' ||
					/^residential$/i.test(candidate.AddressClassification.Description)
			}
		};
	} catch {
		throw new ShippingError(
			'UPS could not validate this address. Check the destination or select No under Validation.'
		);
	}
}
