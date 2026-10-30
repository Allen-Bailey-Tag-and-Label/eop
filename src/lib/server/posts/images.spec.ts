import { beforeEach, describe, expect, it, vi } from 'vitest';
const model = vi.hoisted(() => ({ create: vi.fn(), find: vi.fn(), findOne: vi.fn() }));
vi.mock('../mongoose/defineModel', () => ({ defineModel: () => model }));
vi.mock('../mongoose/models/Post', () => ({ Post: { exists: vi.fn() } }));
import { Post } from '../mongoose/models/Post';
import { uploadPostImage, servePostImage, validateImageBytes, listPostImages } from './images';
const postId = 'a'.repeat(24),
	imageId = 'b'.repeat(24);
const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(Post.exists).mockResolvedValue({ _id: postId } as never);
});
describe('post image storage', () => {
	it('stores binary image data with its owning post and returns a reusable reference', async () => {
		model.create.mockResolvedValue({ _id: imageId, name: 'photo.png' });
		const body = new FormData();
		body.set('file', new File([bytes], 'photo.png', { type: 'image/png' }));
		const result = await uploadPostImage(
			new Request('https://example.test/post/manage/' + postId, { method: 'POST', body }),
			postId,
			postId
		);
		expect(result).toMatchObject({ image: { url: `/posts/images/${postId}/${imageId}` } });
		expect(model.create).toHaveBeenCalledWith(
			expect.objectContaining({ postId, data: bytes, contentType: 'image/png' })
		);
	});
	it('rejects missing posts, oversized files and mislabeled content', async () => {
		vi.mocked(Post.exists).mockResolvedValue(null);
		const result = await uploadPostImage(
			new Request('https://example.test', { method: 'POST', body: new FormData() }),
			postId,
			postId
		);
		expect(result).toMatchObject({ status: 400 });
		expect(model.create).not.toHaveBeenCalled();
		expect(() => validateImageBytes(Buffer.from('<svg/>'), 'image/png')).toThrow(
			'matching file type'
		);
		expect(() => validateImageBytes(Buffer.alloc(3 * 1024 * 1024 + 1), 'image/png')).toThrow(
			'3 MB'
		);
	});
	it('lists only the current post images and serves bytes only under their owning post', async () => {
		model.find.mockReturnValue({
			select: () => ({
				sort: () => ({ limit: () => ({ lean: async () => [{ _id: imageId, name: 'Photo' }] }) })
			})
		});
		expect(await listPostImages(postId)).toHaveLength(1);
		expect(model.find).toHaveBeenCalledWith({ postId });
		model.findOne.mockReturnValue({
			select: async () => ({ data: bytes, contentType: 'image/png' })
		});
		const response = await servePostImage(postId, imageId);
		expect(model.findOne).toHaveBeenCalledWith({ _id: imageId, postId });
		expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});
});
