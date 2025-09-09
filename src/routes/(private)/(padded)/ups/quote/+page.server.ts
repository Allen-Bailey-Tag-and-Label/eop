import { fail, redirect, type Actions } from '@sveltejs/kit';
import { deserialize } from '$app/forms';
import { Branch, UpsQuote } from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';

export const actions: Actions = {
	default: async ({ fetch, locals, request }) => {
		await connect();

		let {
			_branchId,
			isValidated,
			shipFromAddress,
			shipFromZIP,
			shipFromCity,
			shipFromState,
			shipToAddress,
			shipToZIP,
			shipToCity,
			shipToState,
			packageInfoTotalPackages,
			packageInfoTotalWeight
		} = <Record<string, string>>Object.fromEntries(await request.formData());

		let AddressClassification = { Description: 'Unknown' };

		if (isValidated === 'true') {
			const validatedAddress = await validateAddress(
				fetch,
				shipToAddress,
				shipToCity,
				shipToState,
				shipToZIP
			);
			if (!validatedAddress) {
				return fail(400, { error: 'Could not validate address' });
			}

			AddressClassification = validatedAddress?.AddressClassification;
			shipToAddress = validatedAddress?.shipToAddress || shipToAddress;
			shipToCity = validatedAddress?.shipToCity || shipToCity;
			shipToState = validatedAddress?.shipToState || shipToState;
			shipToZIP = validatedAddress?.shipToZIP || shipToZIP;
		}

		const packageWeight = Math.ceil(+packageInfoTotalWeight / +packageInfoTotalPackages).toString();

		const rates = await getRates(
			_branchId,
			fetch,
			shipFromAddress,
			shipFromCity,
			shipFromState,
			shipFromZIP,
			shipToAddress,
			shipToCity,
			shipToState,
			shipToZIP,
			packageWeight,
			packageInfoTotalPackages
		);

		const quote = await createQuote({
			_branchId,
			_createdById: locals.user._id,
			AddressClassification,
			isValidated: isValidated === 'true',
			packageInfoTotalPackages,
			packageInfoTotalWeight,
			packageWeight,
			rates,
			shipper: {
				AddressLine: shipFromAddress,
				City: shipFromCity,
				StateProvinceCode: shipFromState,
				PostalCode: shipFromZIP,
				CountryCode: 'US'
			},
			shipTo: {
				AddressLine: shipToAddress,
				City: shipToCity,
				StateProvinceCode: shipToState,
				PostalCode: shipToZIP,
				CountryCode: 'US'
			}
		});

		throw redirect(303, `/ups/quote/${quote}`);
	}
};

const calculateRate = async ({
	_branchId,
	MonetaryValue,
	packageInfoTotalPackages
}: {
	_branchId: string;
	MonetaryValue: string;
	packageInfoTotalPackages: string;
}) => {
	const branch = (await Branch.find({ _id: _branchId })) ?? { number: 2046 };
	let discountPercent = 0;
	if (branch.number === 2060) {
		const phases = [
			{ discountPercent: 0.25, from: Date.parse('06/01/2025'), to: Date.parse('11/30/2025') },
			{ discountPercent: 0.125, from: Date.parse('12/01/2025'), to: Date.parse('05/31/2026') }
		];
		const now = new Date().getTime();
		phases.forEach((phase) => {
			if (now >= phase.from && now <= phase.to) discountPercent = phase.discountPercent;
		});
	}
	return +MonetaryValue * +packageInfoTotalPackages * (1 - discountPercent);
};

const createQuote = async ({
	_branchId,
	_createdById,
	AddressClassification,
	isValidated,
	packageInfoTotalPackages,
	packageInfoTotalWeight,
	packageWeight,
	rates,
	shipper,
	shipTo
}: {
	_branchId: string;
	_createdById: string;
	AddressClassification: any;
	isValidated: boolean;
	packageInfoTotalPackages: string;
	packageInfoTotalWeight: string;
	packageWeight: string;
	rates: { description: string; rate: number }[];
	shipper: {
		AddressLine: string;
		City: string;
		StateProvinceCode: string;
		PostalCode: string;
		CountryCode: string;
	};
	shipTo: {
		AddressLine: string;
		City: string;
		StateProvinceCode: string;
		PostalCode: string;
		CountryCode: string;
	};
}) => {
	const lastQuote = await UpsQuote.findOne().sort({ quote: -1 });
	if (!lastQuote) return {};
	const quote = lastQuote.quote + 1;

	const quoteData = {
		_branchId,
		_createdById,
		classification: AddressClassification.Description,
		date: new Date(),
		isValidated,
		packageTotalCount: +packageInfoTotalPackages,
		packageTotalWeight: +packageInfoTotalWeight,
		packageWeight: +packageWeight,
		quote,
		rates,
		shipper,
		shipTo
	};

	await UpsQuote.create(quoteData);

	return quote;
};

const getRates = async (
	_branchId: string,
	fetch: any,
	shipFromAddress: string,
	shipFromCity: string,
	shipFromState: string,
	shipFromZIP: string,
	shipToAddress: string,
	shipToCity: string,
	shipToState: string,
	shipToZIP: string,
	packageWeight: string,
	packageInfoTotalPackages: string
) => {
	const formData = new FormData();
	formData.append('shipFromAddress', shipFromAddress);
	formData.append('shipFromCity', shipFromCity);
	formData.append('shipFromState', shipFromState);
	formData.append('shipFromZIP', shipFromZIP);
	formData.append('shipToAddress', shipToAddress);
	formData.append('shipToCity', shipToCity);
	formData.append('shipToState', shipToState);
	formData.append('shipToZIP', shipToZIP);
	formData.append('packageWeight', packageWeight);

	const response = await fetch('/ups/get-rate', {
		method: 'POST',
		body: formData
	});

	const result = deserialize(await response.text()) || { data: {} };
	if (result.type !== 'success') throw 'Could not get rate';
	const { data: RatedShipment } = result;
	if (!RatedShipment) throw 'Could not get rate';

	const rates = await Promise.all(
		[
			['03', 'Ground'],
			['12', '3 Day Select'],
			['02', '2nd Day Air'],
			['59', '2nd Day Air A.M.'],
			['13', 'Next Day Air Saver'],
			['01', 'Next Day Air'],
			['14', 'Next Day Air Early'],
			['75', 'Heavy Goods']
		].map(async ([code, description]) => {
			const shipment = RatedShipment.find((obj: any) => obj.Service.Code === code);
			if (!shipment) return;
			const {
				TotalCharges: { MonetaryValue }
			} = shipment;
			const rate = await calculateRate({ _branchId, MonetaryValue, packageInfoTotalPackages });
			return {
				description,
				rate
			};
		})
	);

	return rates;
};

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

const validateAddress = async (
	fetch: any,
	shipToAddress: string,
	shipToCity: string,
	shipToState: string,
	shipToZIP: string
) => {
	const formData = new FormData();
	formData.append('address', shipToAddress);
	formData.append('city', shipToCity);
	formData.append('state', shipToState);
	formData.append('zip', shipToZIP.padStart(5, '0'));

	const response = await fetch('/ups/address-validation', {
		method: 'POST',
		body: formData
	});

	const result = deserialize(await response.text()) || { data: {} };

	if (result.type !== 'success') return;
	const { data: candidates } = result;

	if (candidates === undefined || candidates.length !== 1) return;

	const [candidate] = candidates;
	const {
		AddressClassification,
		AddressKeyFormat: { AddressLine, PoliticalDivision2, PoliticalDivision1, PostcodePrimaryLow }
	} = candidate;
	shipToAddress = AddressLine[0];
	shipToCity = PoliticalDivision2;
	shipToState = PoliticalDivision1;
	shipToZIP = PostcodePrimaryLow;

	return { AddressClassification, shipToAddress, shipToCity, shipToState, shipToZIP };
};
