import type { RequestHandler } from './$types';
import { servePostImage } from '$lib/server/posts/images';
export const GET: RequestHandler = ({ params }) => servePostImage(params.postId, params.imageId);
