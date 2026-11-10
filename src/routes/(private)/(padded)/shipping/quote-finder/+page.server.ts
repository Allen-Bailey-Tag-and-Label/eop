import { loadShippingQuoteFinder } from '$lib/server/shipping/finder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = loadShippingQuoteFinder;
