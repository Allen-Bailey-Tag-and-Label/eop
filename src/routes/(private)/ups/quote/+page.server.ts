import { redirect, type Actions } from '@sveltejs/kit';
import { deserialize } from '$app/forms';
import { UpsQuote } from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';

export const actions: Actions = {
	nonValidated: async ({ fetch, request }) => {
		await connect();

		let {
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

		const packageWeight = Math.ceil(+packageInfoTotalWeight / +packageInfoTotalPackages).toString();

		const rates = await getRates(
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

		const quote = await createQuote(
			{ Description: 'Unknown' },
			packageInfoTotalPackages,
			packageInfoTotalWeight,
			packageWeight,
			rates,
			{
				AddressLine: shipFromAddress,
				City: shipFromCity,
				StateProvinceCode: shipFromState,
				PostalCode: shipFromZIP,
				CountryCode: 'US'
			},
			{
				AddressLine: shipToAddress,
				City: shipToCity,
				StateProvinceCode: shipToState,
				PostalCode: shipToZIP,
				CountryCode: 'US'
			}
		);

		throw redirect(303, `/ups/quote/${quote}`);
	},
	validated: async ({ fetch, request }) => {
		await connect();

		let {
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

		const validatedAddress = await validateAddress(
			fetch,
			shipToAddress,
			shipToCity,
			shipToState,
			shipToZIP
		);
		const AddressClassification = validatedAddress?.AddressClassification;
		shipToAddress = validatedAddress?.shipToAddress || shipToAddress;
		shipToCity = validatedAddress?.shipToCity || shipToCity;
		shipToState = validatedAddress?.shipToState || shipToState;
		shipToZIP = validatedAddress?.shipToZIP || shipToZIP;

		const packageWeight = Math.ceil(+packageInfoTotalWeight / +packageInfoTotalPackages).toString();

		const rates = await getRates(
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

		const quote = await createQuote(
			AddressClassification,
			packageInfoTotalPackages,
			packageInfoTotalWeight,
			packageWeight,
			rates,
			{
				AddressLine: shipFromAddress,
				City: shipFromCity,
				StateProvinceCode: shipFromState,
				PostalCode: shipFromZIP,
				CountryCode: 'US'
			},
			{
				AddressLine: shipToAddress,
				City: shipToCity,
				StateProvinceCode: shipToState,
				PostalCode: shipToZIP,
				CountryCode: 'US'
			}
		);

		throw redirect(303, `/ups/quote/${quote}`);
	}
};

const createQuote = async (
	AddressClassification: any,
	packageInfoTotalPackages: string,
	packageInfoTotalWeight: string,
	packageWeight: string,
	rates: { description: string; rate: number }[],
	shipper: {
		AddressLine: string;
		City: string;
		StateProvinceCode: string;
		PostalCode: string;
		CountryCode: string;
	},
	shipTo: {
		AddressLine: string;
		City: string;
		StateProvinceCode: string;
		PostalCode: string;
		CountryCode: string;
	}
) => {
	const lastQuote = await UpsQuote.findOne().sort({ quote: -1 });
	if (!lastQuote) return {};
	const quote = lastQuote.quote + 1;

	const quoteData = {
		classification: AddressClassification.Description,
		date: new Date(),
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

	const { data: RatedShipment } = deserialize(await response.text()) || { data: {} };

	const rates = [
		['03', 'Ground'],
		['12', '3 Day Select'],
		['02', '2nd Day Air'],
		['59', '2nd Day Air A.M.'],
		['13', 'Next Day Air Saver'],
		['01', 'Next Day Air'],
		['14', 'Next Day Air Early'],
		['75', 'Heavy Goods']
	].map(([code, description]) => {
		const shipment = RatedShipment.find((obj) => obj.Service.Code === code);
		if (!shipment) return;
		const {
			TotalCharges: { MonetaryValue }
		} = shipment;
		return { description, rate: +MonetaryValue * +packageInfoTotalPackages };
	});

	return rates;
};

const serviceMap = new Map([
	['03', 'Ground'],
	['12', '3 Day Select'],
	['02', '2nd Day Air'],
	['59', '2nd Day Air A.M.'],
	['13', 'Next Day Air Saver'],
	['01', 'Next Day Air'],
	['14', 'Next Day Air Early'],
	['75', 'Heavy Goods']
]);

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
	formData.append('zip', shipToZIP);

	const response = await fetch('/ups/address-validation', {
		method: 'POST',
		body: formData
	});

	const result = deserialize(await response.text()) || { data: {} };

	if (result.type !== 'success') return {};
	const { data: candidates } = result;

	if (candidates === undefined || candidates.length !== 1) return {};

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
