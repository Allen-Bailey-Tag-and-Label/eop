import { redirect, type Actions } from '@sveltejs/kit';
import { deserialize } from '$app/forms';
import { UpsQuote } from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';

export const actions: Actions = {
	nonValidated: async ({ fetch, locals, request }) => {
		await connect();

		let {
			branch,
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
			branch,
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
			locals.user._id,
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
	validated: async ({ fetch, locals, request }) => {
		await connect();

		let {
			branch,
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
			branch,
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
			locals.user._id,
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

const calculateRate = ({
	branch,
	MonetaryValue,
	packageInfoTotalPackages
}: {
	branch: string;
	MonetaryValue: string;
	packageInfoTotalPackages: string;
}) => {
	let discountPercent = 0;
	if (branch === '2060') {
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

const createQuote = async (
	_createdById: string,
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
		_createdById,
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
	branch: string,
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
		const shipment = RatedShipment.find((obj: any) => obj.Service.Code === code);
		if (!shipment) return;
		const {
			TotalCharges: { MonetaryValue }
		} = shipment;
		const rate = calculateRate({ branch, MonetaryValue, packageInfoTotalPackages });
		return {
			description,
			rate
		};
	});

	return rates;
};

export const load = async ({ url }) => {
	const searchParams = Object.fromEntries(url.searchParams);
	return {
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
