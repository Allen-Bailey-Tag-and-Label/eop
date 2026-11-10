import { connect } from '$lib/server/mongoose/connect';
import { listShippingQuotes } from '$lib/server/shipping/quotes';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ url }) => {
	await connect();
	return listShippingQuotes(url);
};
