import { json } from '@sveltejs/kit';
import { getPlayback } from '$lib/server/slides/content';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals }) => json(await getPlayback(locals.monitor.id));
