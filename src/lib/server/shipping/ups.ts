import { env } from '$env/dynamic/private';
import { getAccessToken } from '$lib/ups/getAccessToken/getAccessToken';
import { decimalHundredths } from '$lib/shipping/markups';
import { ShippingError } from '$lib/shipping/validation';
import type { CarrierRate, ShippingAddress, ShippingRequest } from '$lib/shipping/types';

const services: Record<string, string> = {
	'01': 'Next Day Air',
	'02': '2nd Day Air',
	'03': 'Ground',
	'12': '3 Day Select',
	'13': 'Next Day Air Saver',
	'14': 'Next Day Air Early',
	'59': '2nd Day Air A.M.',
	'75': 'Heavy Goods'
};
function address(value: ShippingAddress) {
	return {
		AddressLine: [value.address],
		City: value.city,
		StateProvinceCode: value.state,
		PostalCode: value.zip,
		CountryCode: 'US',
		...(value.residential ? { ResidentialAddressIndicator: 'Y' } : {})
	};
}
export function upsRatePayload(request: ShippingRequest, account?: string) {
	return {
		RateRequest: {
			Request: { TransactionReference: { CustomerContext: 'EOP Shipping Quote' } },
			Shipment: {
				Shipper: {
					Address: address(request.shipFrom),
					...(account ? { ShipperNumber: account } : {})
				},
				ShipFrom: { Address: address(request.shipFrom) },
				ShipTo: { Address: address(request.shipTo) },
				...(account
					? {
							ShipmentRatingOptions: { NegotiatedRatesIndicator: 'Y' },
							PaymentDetails: {
								ShipmentCharge: [{ Type: '01', BillShipper: { AccountNumber: account } }]
							}
						}
					: {}),
				DeliveryTimeInformation: {
					PackageBillType: '03',
					Pickup: { Date: request.shipDate.replaceAll('-', '') }
				},
				Package: request.packages.flatMap((group) =>
					Array.from({ length: group.quantity }, () => ({
						PackagingType: { Code: '02' },
						PackageWeight: { UnitOfMeasurement: { Code: 'LBS' }, Weight: String(group.weight) },
						...(group.length !== undefined &&
						group.width !== undefined &&
						group.height !== undefined
							? {
									Dimensions: {
										UnitOfMeasurement: { Code: 'IN' },
										Length: String(group.length),
										Width: String(group.width),
										Height: String(group.height)
									}
								}
							: {})
					}))
				)
			}
		}
	};
}
type Amount = { CurrencyCode?: string; MonetaryValue?: string };
type UpsRate = {
	Service?: { Code?: string; Description?: string };
	TotalCharges?: Amount;
	NegotiatedRateCharges?: { TotalCharge?: Amount };
};
export function normalizeUpsRates(value: unknown): CarrierRate[] {
	const body = value as { RateResponse?: { RatedShipment?: UpsRate | UpsRate[] } } | null;
	const shipments = body?.RateResponse?.RatedShipment;
	if (!shipments) throw new ShippingError('UPS returned no rates.');
	const rows = Array.isArray(shipments) ? shipments : [shipments];
	if (!rows.length) throw new ShippingError('UPS returned no rates.');
	return rows.map((row) => {
		const negotiated = row.NegotiatedRateCharges?.TotalCharge;
		const amount = negotiated ?? row.TotalCharges;
		if (amount?.CurrencyCode !== 'USD' || !row.Service?.Code)
			throw new ShippingError('UPS returned an unsupported or incomplete rate.');
		return {
			service: 'UPS',
			provider: 'UPS',
			carrier: 'UPS',
			code: row.Service.Code,
			description:
				services[row.Service.Code] ?? row.Service.Description ?? `UPS service ${row.Service.Code}`,
			currency: 'USD',
			costCents: decimalHundredths(amount.MonetaryValue, 'UPS rate'),
			rateBasis: negotiated ? 'negotiated' : 'published'
		};
	});
}
export async function getUpsShippingRates(request: ShippingRequest): Promise<CarrierRate[]> {
	const signal = AbortSignal.timeout(25_000);
	const token = await getAccessToken(signal);
	const response = await fetch('https://onlinetools.ups.com/api/rating/v2409/Shop', {
		method: 'POST',
		signal,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			transId: crypto.randomUUID().replaceAll('-', ''),
			transactionSrc: 'ennis-eop'
		},
		body: JSON.stringify(upsRatePayload(request, env.UPS_SHIPPER_NUMBER))
	});
	if (!response.ok)
		throw new ShippingError(
			'UPS could not return rates. Check the shipment details and try again.'
		);
	return normalizeUpsRates(await response.json());
}
