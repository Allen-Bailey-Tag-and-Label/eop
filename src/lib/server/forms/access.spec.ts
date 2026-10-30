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
function event(path = '/forms/feedback/data', cookie?: string) {
	return {
		url: new URL(`https://example.com${path}`),
		params: { slug: 'feedback', year: '2026', month: '10', day: '30' },
		route: {
			id: path.startsWith('/forms')
				? '/(public)/(padded)/forms/[slug]/data'
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
		query({ _id: id, slug: 'feedback', published: blankForm(), publishedVersion: 1 }) as never
	);
	vi.mocked(User.findById).mockReturnValue(
		query({ _id: id, isActive: true, _roleIds: [role] }) as never
	);
});
describe('central content audiences', () => {
	it('preserves legacy public posts and distinguishes employee and role access', () => {
		expect(canRead({})).toBe(true);
		expect(canRead({ audience: 'employees' })).toBe(false);
		expect(canRead({ audience: 'employees' }, { id, roleIds: [] })).toBe(true);
		expect(canRead({ audience: 'roles', roleIds: [role] }, { id, roleIds: [] })).toBe(false);
		expect(canRead({ audience: 'roles', roleIds: [role] }, { id, roleIds: [role] })).toBe(true);
	});
	it('denies form data and submission requests before route execution when authentication is missing or inactive', async () => {
		vi.mocked(PublishedForm.findOne).mockReturnValue(
			query({
				_id: id,
				slug: 'feedback',
				published: { ...blankForm(), audience: 'employees' },
				publishedVersion: 1
			}) as never
		);
		expect((await authorizeContent(event()))?.status).toBe(401);
		vi.mocked(User.findById).mockReturnValue(
			query({ _id: id, isActive: false, _roleIds: [role] }) as never
		);
		expect((await authorizeContent(event('/forms/feedback/data', id)))?.status).toBe(401);
	});
	it('applies both form and embedding post restrictions, verifying the form belongs to the post', async () => {
		vi.mocked(Post.findById).mockReturnValue(
			query({ _id: postId, audience: 'roles', roleIds: [role], formIds: [id] }) as never
		);
		expect((await authorizeContent(event(`/forms/feedback/data?post=${postId}`)))?.status).toBe(
			401
		);
		const allowed = event(`/forms/feedback/data?post=${postId}`, id);
		expect(await authorizeContent(allowed)).toBeUndefined();
		expect(allowed.locals.authorizedForm?.postId).toBe(postId);
		vi.mocked(Post.findById).mockReturnValue(
			query({ _id: postId, audience: 'public', formIds: [] }) as never
		);
		expect((await authorizeContent(event(`/forms/feedback/data?post=${postId}`)))?.status).toBe(
			404
		);
	});
	it('redirects employee post pages to sign-in and does not serialize private content', async () => {
		vi.mocked(Post.findOne).mockReturnValue(
			query({ _id: postId, audience: 'employees', md: 'private' }) as never
		);
		const input = event('/posts/2026/10/30/feedback');
		expect((await authorizeContent(input))?.headers.get('location')).toBe('/sign-in');
		expect(input.locals.authorizedPost).toBeUndefined();
	});
	it('blocks unpublished forms and requires sign-in for identified public forms', async () => {
		vi.mocked(PublishedForm.findOne).mockReturnValue(query({ _id: id }) as never);
		expect((await authorizeContent(event()))?.status).toBe(404);
		vi.mocked(PublishedForm.findOne).mockReturnValue(
			query({
				_id: id,
				slug: 'feedback',
				published: { ...blankForm(), anonymous: false },
				publishedVersion: 1
			}) as never
		);
		expect((await authorizeContent(event()))?.status).toBe(401);
	});
});
