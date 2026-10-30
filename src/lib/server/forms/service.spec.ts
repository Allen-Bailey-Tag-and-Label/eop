import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blankForm } from '$lib/forms/definition';
import {
	submitForm,
	saveForm,
	deleteForm,
	previewForm,
	handleFormAction,
	listForms
} from './service';
import { PublishedForm, FormSubmission } from './models';
import { Post } from '../mongoose/models/Post';
vi.mock('./models', () => ({
	PublishedForm: {
		updateOne: vi.fn(),
		create: vi.fn(),
		findById: vi.fn(),
		findOne: vi.fn(),
		find: vi.fn(),
		deleteOne: vi.fn()
	},
	FormSubmission: { create: vi.fn(), exists: vi.fn() }
}));
vi.mock('../mongoose/models/Post', () => ({ Post: { exists: vi.fn(), findById: vi.fn() } }));
vi.mock('../mongoose/models/Role', () => ({ Role: { countDocuments: vi.fn() } }));
const id = 'a'.repeat(24),
	actor = { id: 'b'.repeat(24), roleIds: [] };
function form() {
	const definition = blankForm();
	definition.questions[0].id = 'feedback';
	return { id, slug: 'feedback', version: 3, definition, postId: 'c'.repeat(24) };
}
function fields() {
	const fields = new FormData();
	fields.set('version', '3');
	fields.set('token', '00000000-0000-4000-8000-000000000001');
	fields.set('answer:feedback', 'A useful response');
	return fields;
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(FormSubmission.create).mockResolvedValue({} as never);
});
describe('form storage', () => {
	it('creates questions owned by the post and derives presentation and audience from that post', async () => {
		vi.mocked(Post.findById).mockReturnValue({
			lean: async () => ({ _id: id, audience: 'employees', roleIds: [], formIds: [] })
		} as never);
		vi.mocked(PublishedForm.create).mockResolvedValue({ _id: id } as never);
		vi.mocked(PublishedForm.findById).mockReturnValue({
			lean: async () => ({
				_id: id,
				slug: 'feedback',
				title: 'feedback',
				draft: blankForm(),
				version: 1
			})
		} as never);
		const data = new FormData();
		data.set('slug', 'feedback');
		data.set('version', '0');
		data.set('intent', 'publish');
		data.set(
			'definition',
			JSON.stringify({
				...blankForm(),
				title: 'Separate heading',
				description: 'Separate intro',
				audience: 'public'
			})
		);
		await handleFormAction(
			new Request('https://example.test/post/manage/' + id, { method: 'POST', body: data }),
			actor.id,
			'save',
			id
		);
		expect(PublishedForm.create).toHaveBeenCalledWith(
			expect.objectContaining({
				postId: id,
				published: expect.objectContaining({
					title: 'feedback',
					description: '',
					audience: 'employees',
					roleIds: []
				})
			})
		);
	});
	it('requires a saved post before managing questions', async () => {
		const result = await handleFormAction(
			new Request('https://example.test/post/new', {
				method: 'POST',
				body: new FormData()
			}),
			actor.id,
			'save'
		);
		expect(result).toMatchObject({
			status: 400,
			data: { error: expect.stringContaining('Save the post') }
		});
		expect(PublishedForm.create).not.toHaveBeenCalled();
		expect(await listForms()).toEqual([]);
	});
	it('does not claim a legacy question set used by another post', async () => {
		vi.mocked(Post.findById).mockReturnValue({
			lean: async () => ({ _id: id, formIds: ['d'.repeat(24)] })
		} as never);
		vi.mocked(PublishedForm.findOne).mockReturnValue({
			select: () => ({ lean: async () => ({ _id: 'd'.repeat(24) }) })
		} as never);
		vi.mocked(Post.exists).mockResolvedValue({ _id: 'e'.repeat(24) } as never);
		const data = new FormData();
		data.set('id', 'd'.repeat(24));
		const result = await handleFormAction(
			new Request('https://example.test/post/manage/' + id, { method: 'POST', body: data }),
			actor.id,
			'save',
			id
		);
		expect(result).toMatchObject({
			status: 400,
			data: { error: expect.stringContaining('shared by multiple posts') }
		});
		expect(PublishedForm.updateOne).not.toHaveBeenCalled();
	});
	it('rejects managing questions that are not owned by or historically linked to this post', async () => {
		vi.mocked(Post.findById).mockReturnValue({
			lean: async () => ({ _id: id, formIds: [] })
		} as never);
		vi.mocked(PublishedForm.findOne).mockReturnValue({
			select: () => ({ lean: async () => null })
		} as never);
		const data = new FormData();
		data.set('id', 'd'.repeat(24));
		const result = await handleFormAction(
			new Request('https://example.test/post/manage/' + id, {
				method: 'POST',
				body: data
			}),
			actor.id,
			'responses',
			id
		);
		expect(result).toMatchObject({
			status: 400,
			data: { error: expect.stringContaining('not part of this post') }
		});
	});
	it('refuses submissions without a post context', async () => {
		await expect(
			submitForm({ ...form(), postId: undefined } as never, actor, fields())
		).rejects.toThrow('Open the post');
		expect(FormSubmission.create).not.toHaveBeenCalled();
	});
	it('previews the published version rather than the draft without leaking audience details', async () => {
		vi.mocked(PublishedForm.findOne).mockReturnValue({
			select: () => ({
				lean: async () => ({
					published: { ...blankForm(), title: 'Published title', audience: 'roles', roleIds: [id] },
					draft: { ...blankForm(), title: 'Unpublished edit' },
					publishedVersion: 3
				})
			})
		} as never);
		const result = await previewForm('feedback');
		expect(result).toMatchObject({ version: 3, definition: { title: 'Published title' } });
		expect(result.definition).not.toHaveProperty('roleIds');
		expect(result.definition).not.toHaveProperty('audience');
	});
	it('returns a useful preview error for a missing or unpublished form', async () => {
		vi.mocked(PublishedForm.findOne).mockReturnValue({
			select: () => ({ lean: async () => null })
		} as never);
		await expect(previewForm('missing')).rejects.toThrow('Publish this form');
	});
	it('stores anonymous answers with immutable questions and no user identity or creator', async () => {
		const published = form();
		await submitForm(published, actor, fields());
		const saved = vi.mocked(FormSubmission.create).mock.calls[0][0] as Record<string, unknown>;
		expect(saved).toMatchObject({
			postId: expect.anything(),
			formVersion: 3,
			answers: { feedback: 'A useful response' },
			definition: published.definition
		});
		expect(saved.respondentId).toBeUndefined();
		expect(saved._createdById).toBeUndefined();
	});
	it('records identity only when the form explicitly requests it', async () => {
		const published = form();
		published.definition.anonymous = false;
		await submitForm(published, actor, fields());
		expect(
			String(
				(vi.mocked(FormSubmission.create).mock.calls[0][0] as unknown as { respondentId: unknown })
					.respondentId
			)
		).toBe(actor.id);
	});
	it('rejects stale versions, closed forms and invalid answers without storing', async () => {
		const published = form();
		const stale = fields();
		stale.set('version', '1');
		await expect(submitForm(published, actor, stale)).rejects.toThrow('changed');
		published.definition.open = false;
		await expect(submitForm(published, actor, fields())).rejects.toThrow('closed');
		expect(FormSubmission.create).not.toHaveBeenCalled();
	});
	it('treats a repeated idempotency token as already received', async () => {
		vi.mocked(FormSubmission.create).mockRejectedValue({ code: 11000 });
		await expect(submitForm(form(), actor, fields())).resolves.toHaveProperty('success');
	});
	it('saves a draft without replacing the publication and uses optimistic version checks', async () => {
		vi.mocked(PublishedForm.updateOne).mockResolvedValue({ matchedCount: 1 } as never);
		vi.mocked(PublishedForm.findById).mockReturnValue({
			lean: async () => ({
				_id: id,
				slug: 'feedback',
				title: 'Feedback',
				version: 4,
				draft: form().definition,
				published: form().definition
			})
		} as never);
		const data = new FormData();
		data.set('id', id);
		data.set('version', '3');
		data.set('slug', 'feedback');
		data.set('intent', 'draft');
		data.set('definition', JSON.stringify(form().definition));
		await saveForm(data, actor.id);
		const update = (
			vi.mocked(PublishedForm.updateOne).mock.calls as unknown as unknown[][]
		)[0][1] as {
			$set: Record<string, unknown>;
		};
		expect(update.$set.published).toBeUndefined();
		expect(vi.mocked(PublishedForm.updateOne).mock.calls[0][0]).toMatchObject({
			_id: id,
			version: 3
		});
	});
	it('refuses to delete a form used by a post or with responses', async () => {
		vi.mocked(Post.exists).mockResolvedValue({ _id: id } as never);
		const data = new FormData();
		data.set('id', id);
		data.set('confirm', 'delete');
		await expect(deleteForm(data)).rejects.toThrow('Close it');
		expect(PublishedForm.deleteOne).not.toHaveBeenCalled();
	});
});
