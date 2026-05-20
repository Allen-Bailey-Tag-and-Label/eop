// getRates.ts
import { getAccessToken, type Address, type Package } from '../';

export const getRates = async (shipper: Address, shipTo: Address, upsPackage: Package) => {
	const token = await getAccessToken();

	const response = await fetch('https://onlinetools.ups.com/api/rating/v1/Shop', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			transId: crypto.randomUUID(),
			transactionSrc: 'ennis-eop'
		},
		body: JSON.stringify({
			RateRequest: {
				Request: {
					TransactionReference: {
						CustomerContext: 'Shop Rates'
					}
				},
				Shipment: {
					Shipper: {
						Address: {
							AddressLine: [shipper.address],
							City: shipper.city,
							StateProvinceCode: shipper.state,
							PostalCode: String(shipper.zip),
							CountryCode: shipper.country ?? 'US'
						}
					},
					ShipTo: {
						Address: {
							AddressLine: [shipTo.address],
							City: shipTo.city,
							StateProvinceCode: shipTo.state,
							PostalCode: String(shipTo.zip),
							CountryCode: shipTo.country ?? 'US'
						}
					},
					ShipFrom: {
						Address: {
							AddressLine: [shipper.address],
							City: shipper.city,
							StateProvinceCode: shipper.state,
							PostalCode: String(shipper.zip),
							CountryCode: shipper.country ?? 'US'
						}
					},
					ShipmentRatingOptions: {
						NegotiatedRatesIndicator: ''
					},
					Package: [
						{
							PackagingType: {
								Code: '02'
							},
							PackageWeight: {
								UnitOfMeasurement: {
									Code: 'LBS'
								},
								Weight: String(upsPackage.weight)
							}
						}
					]
				}
			}
		})
	});

	const result = await response.json();

	if (!response.ok) {
		console.error(JSON.stringify(result));
		throw new Error(result?.response?.errors?.[0]?.message ?? 'UPS rate request failed');
	}

	return result;
};
