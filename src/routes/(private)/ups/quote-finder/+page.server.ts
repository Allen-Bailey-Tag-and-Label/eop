import type { PageServerLoad } from './$types';
import { UpsQuote } from '$lib/server/mongoose/models';

export const load: PageServerLoad = async () => {
	return {
		rows: new Promise(async (res) => {
			const rows = await UpsQuote.find().lean();
			res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
