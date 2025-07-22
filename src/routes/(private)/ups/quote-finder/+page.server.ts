import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { upsQuote } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	return {
		rows: db.select().from(upsQuote)
	};
};
