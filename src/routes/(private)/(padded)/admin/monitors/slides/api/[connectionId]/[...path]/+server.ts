import { serveDataApi } from '$lib/server/data/proxy';
import type { RequestHandler } from './$types';

export const config = { maxDuration: 15 };
export const GET: RequestHandler = (event) => serveDataApi(event);
export const HEAD = GET;
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
