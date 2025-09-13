import { Branch, QuoteMarginCalculation } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { _default } from '../+page.server.js';

export const actions: Actions = {
	default: _default
};

export const load = async ({ params: { number } }) => {
	const [_branchIds, quote] = await Promise.all([
		Branch.find().lean().exec(),
		QuoteMarginCalculation.findOne({ 'current.number': Number(number) })
			.lean()
			.exec()
	]);
	return {
		_branchIds: JSON.parse(JSON.stringify(_branchIds)),
		quote: JSON.parse(JSON.stringify(quote))
	};
};
