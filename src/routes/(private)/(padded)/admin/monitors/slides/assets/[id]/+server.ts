import { serveAsset } from '$lib/server/slides/assets';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = ({ params }) => serveAsset(params.id);
