import { error } from '@sveltejs/kit';
import { connect } from '$lib/server/mongoose/connect';
import { findShippingQuote } from '$lib/server/shipping/quotes';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	await connect();
	const quote = await findShippingQuote(params.number);
	if (!quote) error(404, 'Quote not found.');
	return { quote };
};
