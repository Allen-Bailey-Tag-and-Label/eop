import { Types } from 'mongoose';
import { fail } from '@sveltejs/kit';
import { PublishedForm, FormSubmission } from './models';
import { Post } from '../mongoose/models/Post';
import { Role } from '../mongoose/models/Role';
import {
	validateForm,
	validateAnswers,
	idPattern,
	FormValidationError,
	text
} from '$lib/forms/definition';
import type { AuthorizedForm, ContentActor } from './access';
export async function previewForm(slug: string) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100)
		throw new FormValidationError('Invalid form slug.');
	const row = await PublishedForm.findOne({ slug }).select('published publishedVersion').lean();
	if (!row?.published || !row.publishedVersion)
		throw new FormValidationError('Publish this form before previewing it in the post.');
	const { title, description, questions, open, anonymous, thanks } = row.published;
	return {
		version: row.publishedVersion,
		definition: { title, description, questions, open, anonymous, thanks }
	};
}
export async function listForms() {
	const rows = await PublishedForm.find()
		.select('slug title version draft published publishedVersion')
		.sort({ title: 1 })
		.limit(500)
		.lean();
	return rows.map((row) => ({
		id: String(row._id),
		slug: row.slug,
		title: row.title,
		version: row.version,
		published: !!row.published
	}));
}
export async function formEditor(id: string) {
	if (!idPattern.test(id)) throw new FormValidationError('Invalid form ID.');
	const row = await PublishedForm.findById(id).lean();
	if (!row) throw new FormValidationError('This form no longer exists.');
	return {
		id: String(row._id),
		slug: row.slug,
		title: row.title,
		version: row.version,
		draft: validateForm(row.draft),
		published: !!row.published
	};
}
export async function saveForm(fields: FormData, userId: string) {
	const raw = String(fields.get('definition') ?? '');
	if (raw.length > 100000) throw new FormValidationError('Form definition is too large.');
	const definition = validateForm(JSON.parse(raw));
	const slug = text(fields.get('slug'), 'Form slug', 100);
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
		throw new FormValidationError('Use a lowercase form slug with letters, numbers and hyphens.');
	if (
		definition.roleIds.length &&
		(await Role.countDocuments({ _id: { $in: definition.roleIds } })) !== definition.roleIds.length
	)
		throw new FormValidationError('One or more selected roles are unavailable.');
	const id = String(fields.get('id') ?? ''),
		version = Number(fields.get('version'));
	const publish = fields.get('intent') === 'publish';
	if (!Number.isInteger(version) || version < 0 || (id && !idPattern.test(id)))
		throw new FormValidationError('Reload the form before saving.');
	if (id) {
		const saved = await PublishedForm.updateOne(
			{ _id: id, version, slug },
			{
				$set: {
					title: definition.title,
					draft: definition,
					...(publish ? { published: definition, publishedVersion: version + 1 } : {})
				},
				$inc: { version: 1 }
			},
			Object.assign({ runValidators: true }, { _createdById: userId })
		);
		if (!saved.matchedCount)
			throw new FormValidationError(
				'This form changed. Reload it before saving. Form slugs cannot be changed after creation.'
			);
		return formEditor(id);
	}
	const created = await PublishedForm.create({
		slug,
		title: definition.title,
		version: 1,
		draft: definition,
		...(publish ? { published: definition, publishedVersion: 1 } : {}),
		_createdById: userId
	});
	return formEditor(String(created._id));
}
export async function deleteForm(fields: FormData) {
	const id = String(fields.get('id') ?? '');
	if (!idPattern.test(id) || fields.get('confirm') !== 'delete')
		throw new FormValidationError('Confirm form deletion.');
	if ((await Post.exists({ formIds: id })) || (await FormSubmission.exists({ formId: id })))
		throw new FormValidationError(
			'This form has posts or responses. Close it instead of deleting it.'
		);
	const result = await PublishedForm.deleteOne({ _id: id, version: Number(fields.get('version')) });
	if (!result.deletedCount) throw new FormValidationError('The form changed. Reload the library.');
}
export async function formResponses(id: string) {
	if (!idPattern.test(id)) throw new FormValidationError('Invalid form ID.');
	const rows = await FormSubmission.find({ formId: id })
		.sort({ createdAt: -1 })
		.limit(500)
		.populate({ path: 'respondentId', select: 'username' })
		.lean();
	return rows.map((row) => ({
		id: String(row._id),
		submittedAt: row.createdAt.toISOString(),
		version: row.formVersion,
		respondent: row.definition.anonymous
			? 'Anonymous'
			: ((row.respondentId as unknown as { username?: string })?.username ??
				'Unavailable employee'),
		answers: row.definition.questions.map((question) => ({
			question: question.label,
			answer: row.answers[question.id] ?? ''
		}))
	}));
}
export async function submitForm(
	form: AuthorizedForm,
	actor: ContentActor | undefined,
	fields: FormData
) {
	const definition = validateForm(form.definition);
	if (!definition.open) throw new FormValidationError('This form is closed.');
	if (Number(fields.get('version')) !== form.version)
		throw new FormValidationError('This form changed. Reload before submitting.');
	if (fields.get('website')) throw new FormValidationError('Could not accept this submission.');
	const token = String(fields.get('token') ?? '');
	if (!/^[a-f0-9-]{36}$/i.test(token))
		throw new FormValidationError('Reload the form before submitting.');
	const answers = validateAnswers(definition, fields);
	if (JSON.stringify(answers).length > 50000)
		throw new FormValidationError('Your response is too long.');
	if (!definition.anonymous && !actor)
		throw new FormValidationError('Sign in before submitting this form.');
	try {
		await FormSubmission.create({
			formId: new Types.ObjectId(form.id),
			formVersion: form.version,
			definition,
			answers,
			token,
			...(form.postId ? { postId: new Types.ObjectId(form.postId) } : {}),
			...(!definition.anonymous && actor ? { respondentId: new Types.ObjectId(actor.id) } : {})
		});
	} catch (cause) {
		if (!(cause && typeof cause === 'object' && 'code' in cause && cause.code === 11000))
			throw cause;
	}
	return { success: definition.thanks };
}
export async function handleFormAction(request: Request, userId: string, operation: string) {
	try {
		const fields = await request.formData();
		if (operation === 'save') return { formRecord: await saveForm(fields, userId) };
		if (operation === 'preview')
			return { preview: await previewForm(String(fields.get('slug') ?? '')) };
		const id = String(fields.get('id') ?? '');
		if (operation === 'responses') return { responses: await formResponses(id) };
		if (fields.get('operation') === 'delete') {
			await deleteForm(fields);
			return { deleted: true };
		}
		return { formRecord: await formEditor(id) };
	} catch (cause) {
		if (cause instanceof FormValidationError || cause instanceof SyntaxError)
			return fail(400, { error: cause.message });
		if (cause && typeof cause === 'object' && 'code' in cause && cause.code === 11000)
			return fail(400, { error: 'That form slug is already in use.' });
		throw cause;
	}
}
