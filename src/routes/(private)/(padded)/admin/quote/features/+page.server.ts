import { serverLoad } from '$lib/server/mongoose';
import { QuoteFeature } from '$lib/server/mongoose/models/QuoteFeature.js';

export const load = serverLoad({
	model: QuoteFeature
});
