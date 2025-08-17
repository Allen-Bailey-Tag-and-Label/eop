import { connect } from '$lib/server/mongoose';
import { UpsQuote } from '$lib/server/mongoose/models';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	await connect();

	return {
		quote: new Promise(async (res) => {
			const quote = await UpsQuote.findOne({ quote: params.quote });
			res(JSON.parse(JSON.stringify(quote)));
		})
	};
};
