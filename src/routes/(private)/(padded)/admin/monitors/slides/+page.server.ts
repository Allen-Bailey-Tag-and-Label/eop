import { listSlides } from '$lib/server/slides/content';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async () => ({ slides: await listSlides() });
