import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePost } from './posts';
import { Post } from '../mongoose/models/Post';
import { PublishedForm } from './models';
vi.mock('../mongoose/models/Post', () => ({
	Post: { exists: vi.fn(), updateOne: vi.fn(), create: vi.fn() }
}));
vi.mock('../mongoose/models/Role', () => ({ Role: { countDocuments: vi.fn() } }));
vi.mock('../mongoose/models/User', () => ({ User: {} }));
vi.mock('./models', () => ({ PublishedForm: { find: vi.fn() } }));
vi.mock('./service', () => ({ listForms: vi.fn(), handleFormAction: vi.fn() }));
const id = 'a'.repeat(24),
	formId = 'b'.repeat(24);
function request() {
	const fields = new FormData();
	for (const [key, value] of Object.entries({
		category: 'feedback',
		title: 'Team feedback',
		slug: 'team-feedback',
		date: '2026-10-30T09:30',
		audience: 'employees',
		roleIds: '[]',
		md: '<PublishedForm slug="feedback"></PublishedForm>'
	}))
		fields.set(key, value);
	return new Request('https://example.test/post/manage/' + id, { method: 'POST', body: fields });
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(Post.exists).mockResolvedValue(null);
	vi.mocked(Post.updateOne).mockResolvedValue({ matchedCount: 1 } as never);
	vi.mocked(PublishedForm.find).mockReturnValue({
		select: () => ({ lean: async () => [{ _id: formId, slug: 'feedback' }] })
	} as never);
});
describe('post form publishing', () => {
	it('saves the audience, actual URL date fields and linked published forms together', async () => {
		expect(await savePost(request(), id, id)).toEqual({ success: 'Post saved.' });
		expect(Post.updateOne).toHaveBeenCalledWith(
			{ _id: id },
			{
				$set: expect.objectContaining({
					audience: 'employees',
					roleIds: [],
					year: 2026,
					month: 10,
					day: 30,
					formIds: [formId]
				})
			},
			expect.objectContaining({ runValidators: true })
		);
	});
	it('does not save a post that embeds an unpublished or missing form', async () => {
		vi.mocked(PublishedForm.find).mockReturnValue({
			select: () => ({ lean: async () => [] })
		} as never);
		const result = await savePost(request(), id, id);
		expect(result).toMatchObject({
			status: 400,
			data: { error: expect.stringContaining('Publish') }
		});
		expect(Post.updateOne).not.toHaveBeenCalled();
	});
	it('prevents another post from using the same canonical URL', async () => {
		vi.mocked(Post.exists).mockResolvedValue({ _id: id } as never);
		expect(await savePost(request(), id, id)).toMatchObject({ status: 400 });
		expect(Post.updateOne).not.toHaveBeenCalled();
	});
});
