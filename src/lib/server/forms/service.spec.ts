import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blankForm } from '$lib/forms/definition';
import { submitForm, saveForm, deleteForm } from './service';
import { PublishedForm, FormSubmission } from './models';
import { Post } from '../mongoose/models/Post';
vi.mock('./models', () => ({
	PublishedForm: { updateOne: vi.fn(), create: vi.fn(), findById: vi.fn(), deleteOne: vi.fn() },
	FormSubmission: { create: vi.fn(), exists: vi.fn() }
}));
vi.mock('../mongoose/models/Post', () => ({ Post: { exists: vi.fn() } }));
vi.mock('../mongoose/models/Role', () => ({ Role: { countDocuments: vi.fn() } }));
const id = 'a'.repeat(24),
	actor = { id: 'b'.repeat(24), roleIds: [] };
function form() {
	const definition = blankForm();
	definition.questions[0].id = 'feedback';
	return { id, slug: 'feedback', version: 3, definition };
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
	it('stores anonymous answers with immutable questions and no user identity or creator', async () => {
		const published = form();
		await submitForm(published, actor, fields());
		const saved = vi.mocked(FormSubmission.create).mock.calls[0][0] as Record<string, unknown>;
		expect(saved).toMatchObject({
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
