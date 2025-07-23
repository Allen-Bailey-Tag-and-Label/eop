import type { PageServerLoad } from './$types';
import { UpsQuote } from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';

export const load: PageServerLoad = async () => {
	await connect();

	return {
		rows: new Promise(async (res) => {
			const rows = await UpsQuote.find().lean();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
