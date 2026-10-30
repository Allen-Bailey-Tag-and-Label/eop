import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePost } from './posts';
import { Post } from '../mongoose/models/Post';
import { PublishedForm } from './models';
import { markdownToDocument } from '$lib/rich-text/markdown';
import marketingMarkdown from '$lib/rich-text/fixtures/marketing.md?raw';
vi.mock('../mongoose/models/Post', () => ({
	Post: { exists: vi.fn(), updateOne: vi.fn(), create: vi.fn() }
}));
vi.mock('../mongoose/models/Role', () => ({ Role: { countDocuments: vi.fn() } }));
vi.mock('../mongoose/models/User', () => ({ User: {} }));
vi.mock('./models', () => ({ PublishedForm: { find: vi.fn() } }));
vi.mock('./service', () => ({ listForms: vi.fn(), handleFormAction: vi.fn() }));
const id = 'a'.repeat(24),
	formId = 'b'.repeat(24);
function request(overrides: Record<string, string> = {}) {
	const fields = new FormData();
	for (const [key, value] of Object.entries({
		category: 'feedback',
		title: 'Team feedback',
		slug: 'team-feedback',
		date: '2026-10-30T09:30',
		audience: 'employees',
		roleIds: '[]',
		md: '<PublishedForm slug="feedback"></PublishedForm>',
		...overrides
	}))
		fields.set(key, value);
	return new Request('https://example.test/post/manage/' + id, { method: 'POST', body: fields });
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(Post.exists).mockImplementation(((filter: { formIds?: unknown }) =>
		Promise.resolve(filter.formIds ? { _id: id } : null)) as never);
	vi.mocked(Post.updateOne).mockResolvedValue({ matchedCount: 1 } as never);
	vi.mocked(PublishedForm.find).mockReturnValue({
		select: () => ({ lean: async () => [{ _id: formId, slug: 'feedback' }] })
	} as never);
});
describe('post form publishing', () => {
	it('persists the marketing document despite a stale Markdown flag, including separators and its link', async () => {
		vi.mocked(PublishedForm.find).mockReturnValue({
			select: () => ({ lean: async () => [] })
		} as never);
		const document = markdownToDocument(marketingMarkdown);
		expect(
			await savePost(
				request({
					contentMode: 'markdown',
					content: JSON.stringify(document),
					md: marketingMarkdown
				}),
				id,
				id
			)
		).toEqual({ success: 'Post saved.' });
		const update = (vi.mocked(Post.updateOne).mock.calls as unknown as unknown[][])[0][1] as {
			$set: { content: unknown };
			$unset?: unknown;
		};
		expect(update.$set.content).toEqual(document);
		expect(update.$unset).toBeUndefined();
		expect(JSON.stringify(document)).toContain('horizontalRule');
	});
	it('does not erase converted content when a stale Markdown-only browser saves', async () => {
		vi.mocked(Post.exists).mockResolvedValue({ _id: id } as never);
		expect(await savePost(request(), id, id)).toMatchObject({
			status: 400,
			data: { error: expect.stringContaining('preserved') }
		});
		expect(Post.updateOne).not.toHaveBeenCalled();
	});
	it('rejects question sets owned by another post and unlinked legacy question sets', async () => {
		vi.mocked(PublishedForm.find).mockReturnValue({
			select: () => ({ lean: async () => [{ _id: formId, postId: 'c'.repeat(24) }] })
		} as never);
		expect(await savePost(request(), id, id)).toMatchObject({ status: 400 });
		vi.mocked(PublishedForm.find).mockReturnValue({
			select: () => ({ lean: async () => [{ _id: formId }] })
		} as never);
		vi.mocked(Post.exists).mockResolvedValue(null);
		expect(await savePost(request(), id, id)).toMatchObject({ status: 400 });
		expect(Post.updateOne).not.toHaveBeenCalled();
	});
	it('stores a versioned rich text document and tracks its question references', async () => {
		const content = {
			schemaVersion: 1,
			doc: {
				type: 'doc',
				content: [
					{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
					{ type: 'component', attrs: { name: 'PublishedForm', slug: 'feedback' } }
				]
			}
		};
		expect(
			await savePost(
				request({ contentMode: 'richtext', content: JSON.stringify(content), md: '' }),
				id,
				id
			)
		).toEqual({ success: 'Post saved.' });
		expect(Post.updateOne).toHaveBeenCalledWith(
			{ _id: id },
			{
				$set: expect.objectContaining({
					content: expect.objectContaining({ schemaVersion: 1 }),
					formIds: [formId],
					md: ''
				})
			},
			expect.anything()
		);
	});
	it('rejects malformed rich text without updating a post', async () => {
		expect(
			await savePost(request({ contentMode: 'richtext', content: '{"schemaVersion":99}' }), id, id)
		).toMatchObject({ status: 400 });
		expect(Post.updateOne).not.toHaveBeenCalled();
	});
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
