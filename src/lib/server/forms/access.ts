import type { RequestEvent } from '@sveltejs/kit';
import { Post } from '../mongoose/models/Post';
import { User } from '../mongoose/models/User';
import { PublishedForm } from './models';
import { idPattern, type AudienceSettings, type FormDefinition } from '$lib/forms/definition';
export type ContentActor = { id: string; roleIds: string[] };
export type AuthorizedForm = {
	id: string;
	slug: string;
	version: number;
	definition: FormDefinition;
	postId?: string;
};
export function canRead(settings: Partial<AudienceSettings>, actor?: ContentActor) {
	if (!settings.audience || settings.audience === 'public') return true;
	if (!actor) return false;
	if (settings.audience === 'employees') return true;
	return (
		settings.audience === 'roles' &&
		(settings.roleIds ?? []).some((id) => actor.roleIds.includes(String(id)))
	);
}
export async function authorizeContent(event: RequestEvent): Promise<Response | undefined> {
	event.setHeaders({ 'cache-control': 'private, no-store' });
	const cookie = event.cookies.get('userId');
	let actor: ContentActor | undefined;
	if (cookie && idPattern.test(cookie)) {
		const user = await User.findById(cookie)
			.select('isActive _roleIds')
			.lean<{ _id: unknown; isActive: boolean; _roleIds?: unknown[] } | null>();
		if (user?.isActive)
			actor = { id: String(user._id), roleIds: (user._roleIds ?? []).map(String) };
	}
	event.locals.contentActor = actor;
	const api = event.route.id?.endsWith('/data');
	const deny = () => {
		if (api)
			return Response.json(
				{ error: actor ? 'You do not have access to this form.' : 'Sign in to access this form.' },
				{ status: actor ? 403 : 401 }
			);
		return actor
			? new Response('You do not have access to this content.', { status: 403 })
			: new Response(null, { status: 303, headers: { location: '/sign-in' } });
	};
	const missing = () =>
		api
			? Response.json({ error: 'This form or post is unavailable.' }, { status: 404 })
			: new Response('Content not found.', { status: 404 });
	if (event.params.slug && event.url.pathname.startsWith('/forms/')) {
		const record = await PublishedForm.findOne({ slug: event.params.slug }).lean();
		if (!record?.published || !record.publishedVersion) return missing();
		const definition = record.published;
		if (!canRead(definition, actor) || (!definition.anonymous && !actor)) return deny();
		let postId: string | undefined;
		const context = event.url.searchParams.get('post');
		if (context) {
			if (!idPattern.test(context)) return missing();
			const post = await Post.findById(context).lean();
			if (!post || !(post.formIds ?? []).some((id: unknown) => String(id) === String(record._id)))
				return missing();
			if (!canRead({ audience: post.audience, roleIds: (post.roleIds ?? []).map(String) }, actor))
				return deny();
			postId = String(post._id);
		}
		event.locals.authorizedForm = {
			id: String(record._id),
			slug: record.slug,
			version: record.publishedVersion,
			definition,
			...(postId ? { postId } : {})
		};
	} else {
		const { year, month, day, slug } = event.params;
		if (![year, month, day].every((value) => /^\d+$/.test(value ?? ''))) return missing();
		const post = await Post.findOne({
			year: Number(year),
			month: Number(month),
			day: Number(day),
			slug
		}).lean();
		if (!post) return missing();
		if (!canRead({ audience: post.audience, roleIds: (post.roleIds ?? []).map(String) }, actor))
			return deny();
		event.locals.authorizedPost = JSON.parse(JSON.stringify(post));
	}
}
