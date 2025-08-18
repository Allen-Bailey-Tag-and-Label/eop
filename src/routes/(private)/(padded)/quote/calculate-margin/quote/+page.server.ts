import { QuoteMarginCalculation } from '$lib/server/mongoose/models';
import { redirect, type Action } from '@sveltejs/kit';

type QuoteFormData = {
	'current.date': string;
	'current.labor': string;
	'current.margin': string;
	'current.material': string;
	'current.number': string;
	'current.sell': string;
	'current.totalCost': string;
	customerType: string;
	'previous.date': string;
	'previous.labor': string;
	'previous.margin': string;
	'previous.material': string;
	'previous.number': string;
	'previous.sell': string;
	'previous.totalCost': string;
	productType: string;
};

export const _default: Action = async ({ locals, request }) => {
	const formData = <QuoteFormData>Object.fromEntries(await request.formData());

	const _createdById = locals.user._id;

	const update = {
		_createdById,
		current: {
			date: new Date(formData['current.date']),
			labor: parseFloat(formData['current.labor']),
			margin: 0,
			material: parseFloat(formData['current.material']),
			number: parseFloat(formData['current.number']),
			sell: 0,
			totalCost: parseFloat(formData['current.totalCost'])
		},
		customerType: formData.customerType,
		previous: {
			date: new Date(formData['previous.date']),
			labor: parseFloat(formData['previous.labor']),
			margin: parseFloat(formData['previous.margin']),
			material: parseFloat(formData['previous.material']),
			number: parseFloat(formData['previous.number']),
			sell: parseFloat(formData['previous.sell']),
			totalCost: parseFloat(formData['previous.totalCost'])
		},
		productType: formData.productType
	};

	let monthDifference =
		(update.current.date.getFullYear() - update.previous.date.getFullYear()) * 12;
	monthDifference -= update.previous.date.getMonth();
	monthDifference += update.current.date.getMonth();

	const increasePercentBasedOnDates = Math.pow(1 + 0.05 / 12, monthDifference);

	update.current.sell = update.previous.sell * increasePercentBasedOnDates;
	update.current.margin = update.current.sell - update.current.totalCost;

	let currentMarginPercent = update.current.margin / update.current.sell;
	let previousMarginPercent = update.previous.margin / update.previous.sell;

	// Make margin at least the previous margin
	if (currentMarginPercent < previousMarginPercent) {
		currentMarginPercent = previousMarginPercent;
		update.current.sell = update.current.totalCost / (1 - currentMarginPercent);
		update.current.margin = update.current.sell - update.current.totalCost;
	}

	const increasePercent = update.current.sell / update.previous.sell - 1;

	// Cap increase percent to 12% / year
	if (increasePercent > Math.pow(1 + 0.12 / 12, monthDifference)) {
		update.current.sell = update.previous.sell * Math.pow(1 + 0.12 / 12, monthDifference);
		update.current.margin = update.current.sell - update.current.totalCost;
	}

	// currentMarginPercent = update.current.margin / update.current.sell;

	// if (currentMarginPercent < 0.1) {
	// 	update.current.sell = update.current.totalCost / (1 - 0.1);
	// 	update.current.margin = update.current.sell - update.current.totalCost;
	// }

	currentMarginPercent = update.current.margin / update.current.sell;

	// Set minimum margin to 35% for TGM product types
	if (update.productType === 'TGM' && currentMarginPercent < 0.35) {
		update.current.sell = update.current.totalCost / (1 - 0.35);
		update.current.margin = update.current.sell - update.current.totalCost;
	}

	for (const groupKey of ['current', 'previous'] as const) {
		for (const key of ['labor', 'margin', 'material', 'sell', 'totalCost'] as const) {
			update[groupKey][key] = Math.round((update[groupKey][key] + Number.EPSILON) * 100) / 100;
		}
	}

	const filter = { 'current.number': update.current.number };
	const quoteMarginCalculation = await QuoteMarginCalculation.findOneAndUpdate(filter, update, {
		new: true,
		upsert: true
	}).lean();

	redirect(303, `/quote/calculate-margin/quote/${quoteMarginCalculation.current.number}`);
};

export const actions = {
	default: _default
};
