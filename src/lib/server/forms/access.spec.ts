import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authorizeContent, canRead } from './access';
import { Post } from '../mongoose/models/Post';
import { User } from '../mongoose/models/User';
import { PublishedForm } from './models';
import { blankForm } from '$lib/forms/definition';
vi.mock('../mongoose/models/Post', () => ({ Post: { findOne: vi.fn(), findById: vi.fn() } }));
vi.mock('../mongoose/models/User', () => ({ User: { findById: vi.fn() } }));
vi.mock('./models', () => ({ PublishedForm: { findOne: vi.fn() } }));
const id = 'a'.repeat(24),
	role = 'b'.repeat(24),
	postId = 'c'.repeat(24);
const query = (value: unknown) => ({
	select: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(value)
});
function event(api = true, cookie?: string) {
	return {
		url: new URL(
			`https://example.com/posts/${api ? `submissions/${postId}/feedback` : '2026/10/30/feedback'}`
		),
		params: api
			? { postId, formSlug: 'feedback' }
			: { slug: 'feedback', year: '2026', month: '10', day: '30' },
		route: {
			id: api
				? '/(public)/(padded)/posts/submissions/[postId]/[formSlug]'
				: '/(public)/(padded)/posts/[year]/[month]/[day]/[slug]'
		},
		cookies: { get: () => cookie },
		setHeaders: vi.fn(),
		locals: {}
	} as unknown as Parameters<typeof authorizeContent>[0];
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(PublishedForm.findOne).mockReturnValue(
		query({
			_id: id,
			postId,
			slug: 'feedback',
			published: blankForm(),
			publishedVersion: 1
		}) as never
	);
	vi.mocked(Post.findById).mockReturnValue(
		query({ _id: postId, audience: 'public', formIds: [id] }) as never
	);
	vi.mocked(User.findById).mockReturnValue(
		query({ _id: id, isActive: true, _roleIds: [role] }) as never
	);
});
describe('post submission access', () => {
	it('protects post image bytes with the same post audience', async () => {
		const input = event();
		input.params = { postId, imageId: id };
		vi.mocked(Post.findById).mockReturnValue(
			query({ _id: postId, audience: 'employees' }) as never
		);
		expect((await authorizeContent(input))?.status).toBe(401);
		const allowed = event(true, id);
		allowed.params = { postId, imageId: id };
		expect(await authorizeContent(allowed)).toBeUndefined();
		expect(PublishedForm.findOne).not.toHaveBeenCalled();
	});
	it('preserves legacy public posts and distinguishes employee and role access', () => {
		expect(canRead({})).toBe(true);
		expect(canRead({ audience: 'employees' })).toBe(false);
		expect(canRead({ audience: 'employees' }, { id, roleIds: [] })).toBe(true);
		expect(canRead({ audience: 'roles', roleIds: [role] }, { id, roleIds: [] })).toBe(false);
		expect(canRead({ audience: 'roles', roleIds: [role] }, { id, roleIds: [role] })).toBe(true);
	});
	it('requires post access for data and submissions and rejects inactive employees', async () => {
		vi.mocked(Post.findById).mockReturnValue(
			query({ _id: postId, audience: 'employees', formIds: [id] }) as never
		);
		expect((await authorizeContent(event()))?.status).toBe(401);
		vi.mocked(User.findById).mockReturnValue(query({ _id: id, isActive: false }) as never);
		expect((await authorizeContent(event(true, id)))?.status).toBe(401);
	});
	it('binds a response to the authorized post and enforces selected roles', async () => {
		vi.mocked(Post.findById).mockReturnValue(
			query({ _id: postId, audience: 'roles', roleIds: [role], formIds: [id] }) as never
		);
		const allowed = event(true, id);
		expect(await authorizeContent(allowed)).toBeUndefined();
		expect(allowed.locals.authorizedForm?.postId).toBe(postId);
		vi.mocked(User.findById).mockReturnValue(
			query({ _id: id, isActive: true, _roleIds: [] }) as never
		);
		expect((await authorizeContent(event(true, id)))?.status).toBe(403);
	});
	it('rejects missing posts, unlinked forms and question sets owned by another post', async () => {
		vi.mocked(Post.findById).mockReturnValue(query(null) as never);
		expect((await authorizeContent(event()))?.status).toBe(404);
		vi.mocked(Post.findById).mockReturnValue(query({ _id: postId, formIds: [] }) as never);
		expect((await authorizeContent(event()))?.status).toBe(404);
		vi.mocked(Post.findById).mockReturnValue(query({ _id: postId, formIds: [id] }) as never);
		vi.mocked(PublishedForm.findOne).mockReturnValue(
			query({ _id: id, postId: id, published: blankForm(), publishedVersion: 1 }) as never
		);
		expect((await authorizeContent(event()))?.status).toBe(404);
	});
	it('requires sign-in for identified responses even on a public post', async () => {
		vi.mocked(PublishedForm.findOne).mockReturnValue(
			query({
				_id: id,
				postId,
				published: { ...blankForm(), anonymous: false },
				publishedVersion: 1
			}) as never
		);
		expect((await authorizeContent(event()))?.status).toBe(401);
	});
	it('redirects private post pages before serializing their content', async () => {
		vi.mocked(Post.findOne).mockReturnValue(
			query({ _id: postId, audience: 'employees', md: 'private' }) as never
		);
		const input = event(false);
		expect((await authorizeContent(input))?.headers.get('location')).toBe('/sign-in');
		expect(input.locals.authorizedPost).toBeUndefined();
	});
	it('preserves existing linked question sets without an owner, including their previous restrictions', async () => {
		vi.mocked(PublishedForm.findOne).mockReturnValue(
			query({
				_id: id,
				published: { ...blankForm(), audience: 'employees' },
				publishedVersion: 1
			}) as never
		);
		expect((await authorizeContent(event()))?.status).toBe(401);
		expect(await authorizeContent(event(true, id))).toBeUndefined();
	});
});
