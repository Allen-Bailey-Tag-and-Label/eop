import type { RequestHandler } from './$types';
import { servePostImage } from '$lib/server/posts/images';
export const GET: RequestHandler = ({ params }) => servePostImage(params._id, params.imageId);
