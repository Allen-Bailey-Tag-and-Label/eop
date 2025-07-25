import type { PageServerLoad } from './$types';
import { UpsQuote } from '$lib/server/mongoose/models';
import { connect } from '$lib/server/mongoose';
import { type RowPromise } from './types';

export const load: PageServerLoad = async () => {
	await connect();

	return {
		rows: new Promise<RowPromise[]>(async (res) => {
			const rows = await UpsQuote.find().populate('_createdById', 'username').lean();
			return res(JSON.parse(JSON.stringify(rows)));
		})
	};
};
