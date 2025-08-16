import { QuoteMarginCalculation } from '$lib/server/mongoose/models';
import type { Actions } from '@sveltejs/kit';
import { _default } from '../+page.server.js';

export const actions: Actions = {
	default: _default
};

export const load = async ({ params: { number } }) => {
	const quote = await QuoteMarginCalculation.findOne({ 'current.number': Number(number) })
		.lean()
		.exec();
	return {
		quote: JSON.parse(JSON.stringify(quote))
	};
};
