import { serverLoad } from '$lib/server/mongoose';
import { QuoteProductType } from '$lib/server/mongoose/models';

export const load = serverLoad({
	model: QuoteProductType
});
