import { loadPublishedPost } from '$lib/server/forms/posts';
export const load = ({ locals }: { locals: App.Locals }) => loadPublishedPost(locals);
