import { connect } from '$lib/server/mongoose';
import { findUpsQuote } from '$lib/server/ups/quotes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	await connect();

	return { quote: await findUpsQuote(params.quote) };
};
