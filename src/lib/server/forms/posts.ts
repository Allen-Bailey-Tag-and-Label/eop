import { fail, redirect } from '@sveltejs/kit';
import { Post } from '../mongoose/models/Post';
import { Role } from '../mongoose/models/Role';
import { User } from '../mongoose/models/User';
import { PublishedForm } from './models';
import { listForms, handleFormAction } from './service';
import {
	audienceSettings,
	embeddedFormSlugs,
	FormValidationError,
	idPattern,
	text,
	postUrl
} from '$lib/forms/definition';
export async function loadPostEditor(id?: string) {
	const roles = await Role.find()
		.select('label')
		.sort({ label: 1 })
		.lean<{ _id: unknown; label: string }[]>();
	let post;
	let linkedIds: unknown[] = [];
	if (id) {
		if (!idPattern.test(id)) redirect(303, '/post/manage');
		const row = await Post.findById(id).lean();
		if (!row) redirect(303, '/post/manage');
		linkedIds = row.formIds ?? [];
		post = {
			_id: String(row._id),
			category: row.category,
			title: row.title,
			slug: row.slug,
			md: row.md,
			date: new Date(Date.UTC(row.year, row.month - 1, row.day, 12)).toISOString(),
			audience: row.audience ?? 'public',
			roleIds: (row.roleIds ?? []).map(String)
		};
	}
	return {
		forms: await listForms(id, linkedIds),
		roles: roles.map((row) => ({ value: String(row._id), label: row.label })),
		...(post ? { post } : {})
	};
}
export async function savePost(request: Request, userId: string, currentId?: string) {
	let savedId = '';
	try {
		const fields = await request.formData();
		const category = text(fields.get('category'), 'Category', 60);
		if (!/^[a-z0-9-]+$/.test(category)) throw new FormValidationError('Choose a valid category.');
		const audience = audienceSettings({
			audience: fields.get('audience') ?? 'public',
			roleIds: JSON.parse(String(fields.get('roleIds') ?? '[]'))
		});
		if (
			audience.roleIds.length &&
			(await Role.countDocuments({ _id: { $in: audience.roleIds } })) !== audience.roleIds.length
		)
			throw new FormValidationError('One or more selected roles are unavailable.');
		const title = text(fields.get('title'), 'Title'),
			slug = text(fields.get('slug'), 'Post slug', 160),
			md = text(fields.get('md'), 'Post content', 100000);
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
			throw new FormValidationError('Use a lowercase post slug with hyphens.');
		const date = new Date(String(fields.get('date') ?? ''));
		if (!Number.isFinite(date.getTime())) throw new FormValidationError('Enter a valid post date.');
		const dateText = String(fields.get('date')).slice(0, 10);
		const [year, month, day] = dateText.split('-').map(Number);
		const slugs = embeddedFormSlugs(md);
		const forms = await PublishedForm.find({ slug: { $in: slugs }, published: { $exists: true } })
			.select('_id slug postId')
			.lean();
		if (forms.length !== slugs.length)
			throw new FormValidationError('Publish each embedded form before saving the post.');
		if (forms.some((form) => form.postId && String(form.postId) !== currentId))
			throw new FormValidationError('Use question sets belonging to this post.');
		const id = currentId ?? '';
		if (id && !idPattern.test(id)) throw new FormValidationError('Invalid post ID.');
		if (await Post.exists({ year, month, day, slug, ...(id ? { _id: { $ne: id } } : {}) }))
			throw new FormValidationError('That post URL is already in use for this date.');
		const update = {
			category,
			title,
			slug,
			md,
			year,
			month,
			day,
			...audience,
			formIds: forms.map((form) => form._id)
		};
		if (id) {
			const result = await Post.updateOne(
				{ _id: id },
				{ $set: update },
				Object.assign({ runValidators: true }, { _createdById: userId })
			);
			if (!result.matchedCount) throw new FormValidationError('This post no longer exists.');
			savedId = id;
		} else savedId = String((await Post.create({ ...update, _createdById: userId }))._id);
	} catch (cause) {
		if (cause instanceof FormValidationError || cause instanceof SyntaxError)
			return fail(400, { error: cause.message });
		throw cause;
	}
	if (!currentId) redirect(303, `/post/manage/${savedId}`);
	return { success: 'Post saved.' };
}
export const formActions = {
	formPreview: ({ request, locals, params }: FormActionEvent) =>
		handleFormAction(request, locals.user._id, 'preview', params._id),
	formSave: ({ request, locals, params }: FormActionEvent) =>
		handleFormAction(request, locals.user._id, 'save', params._id),
	formManage: ({ request, locals, params }: FormActionEvent) =>
		handleFormAction(request, locals.user._id, 'manage', params._id),
	formResponses: ({ request, locals, params }: FormActionEvent) =>
		handleFormAction(request, locals.user._id, 'responses', params._id)
};
type FormActionEvent = { request: Request; locals: App.Locals; params: { _id?: string } };
export async function loadPublishedPost(locals: App.Locals) {
	const post = locals.authorizedPost!;
	let firstName = '',
		lastName = '';
	if (post._createdById) {
		const author = await User.findById(post._createdById)
			.select('_profileId')
			.populate({ path: '_profileId', select: 'firstName lastName' })
			.lean<{ _profileId?: { firstName?: string; lastName?: string } } | null>();
		const profile = author?._profileId as unknown as
			| { firstName?: string; lastName?: string }
			| undefined;
		firstName = profile?.firstName ?? '';
		lastName = profile?.lastName ?? '';
	}
	return {
		post: {
			id: post._id,
			title: post.title,
			md: post.md,
			date: post.createdAt ?? new Date(Date.UTC(post.year, post.month - 1, post.day)).toISOString(),
			firstName,
			lastName,
			url: postUrl(post)
		}
	};
}
