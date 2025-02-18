import type { Actions } from '@sveltejs/kit';
import type { Info, Result } from './types';
import {
	UPS_ACCESS_LICENSE_NUMBER,
	UPS_PASSWORD,
	UPS_TRANS_ID,
	UPS_TRANSACTION_SRC,
	UPS_USERNAME
} from '$env/static/private';
import { prisma } from '$lib';

export const actions: Actions = {
	default: async ({ locals, request }) => {
		// @ts-ignore
		const {
			classification,
			fromAddress,
			fromCity,
			fromState,
			fromZip,
			numberOfPackages,
			toAddress,
			toCity,
			toState,
			toZip,
			totalWeight
		} = <Info>Object.fromEntries(await request.formData());

		const response = await fetch('https://onlinetools.ups.com/ship/v1/rating/Shop', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				AccessLicenseNumber: UPS_ACCESS_LICENSE_NUMBER,
				Username: UPS_USERNAME,
				Password: UPS_PASSWORD,
				transId: UPS_TRANS_ID,
				transactionSrc: UPS_TRANSACTION_SRC,
				'X-Requested-With': 'XMLHttpRequest'
			},
			body: JSON.stringify({
				RateRequest: {
					Shipment: {
						Shipper: {
							Address: {
								AddressLine: fromAddress,
								City: fromCity,
								StateProvineCode: fromState,
								PostalCode: fromZip,
								CountryCode: 'US'
							}
						},
						ShipTo: {
							Address: {
								AddressLine: toAddress,
								City: toCity,
								StateProvineCode: toState,
								PostalCode: toZip,
								CountryCode: 'US'
							}
						},
						NumOfPieces: numberOfPackages,
						Package: [...Array(+numberOfPackages)].map((_, i) => ({
							PackagingType: {
								Code: '02'
							},
							PackageWeight: {
								UnitOfMeasurement: {
									Code: 'LBS'
								},
								Weight: Math.ceil(+totalWeight / +numberOfPackages).toString()
							}
						}))
					}
				}
			})
		});

		const {
			RateResponse: { RatedShipment }
		}: Result = await response.json();

		const number = (await prisma.uPSQuote.findMany()).length + 4809496;

		const data = {
			classification,
			createdBy: { connect: { id: locals.user.id } },
			fromAddress,
			fromCity,
			fromState,
			fromZip,
			number,
			numberOfPackages: +numberOfPackages,
			ratedShipment: RatedShipment,
			toAddress,
			toCity,
			toState,
			totalWeight: +totalWeight,
			toZip
		};

		await Promise.all([
			prisma.uPSQuote.create({ data }),
			prisma.log.create({
				data: {
					createdBy: { connect: { id: locals.user.id } },
					data: JSON.stringify(data),
					model: 'UPSQuote',
					route: '/ups/quote',
					type: 'create'
				}
			})
		]);

		return { number, success: true };
	}
};

export const load = async ({ params, url }) => {
	const info = Object.assign(
		{
			classification: 'Unknown',
			fromAddress: '3177 Lehigh Street',
			fromCity: 'Caledonia',
			fromState: 'NY',
			fromZip: '14423',
			numberOfPackages: '1',
			toAddress: '',
			toCity: '',
			toState: '',
			totalWeight: '30',
			toZip: ''
		},
		Object.fromEntries(url.searchParams)
	);

	return { info };
};
