import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server';
import { authorizeContent } from '$lib/server/forms/access';
vi.mock('$lib/server/forms/access', () => ({ authorizeContent: vi.fn() }));
import { getMonitorSession } from '$lib/server/monitors/sessions';
import { preserveMonitorApprovals } from '$lib/server/monitors/migrate';
import { User } from '$lib/server/mongoose/models';

vi.mock('$env/static/private', () => ({
	INIT_ADMIN_PASSWORD: 'unused',
	INIT_ADMIN_USERNAME: 'unused'
}));
vi.mock('$lib/server/mongoose', () => ({ connect: vi.fn() }));
vi.mock('$lib/server/mongoose/middleware', () => ({ setSkipLogging: vi.fn() }));
vi.mock('$lib/server/mongoose/models', () => ({
	User: { find: vi.fn(), findById: vi.fn() },
	Log: {},
	Role: {},
	Route: {},
	UpsQuote: {}
}));
vi.mock('$lib/server/monitors/sessions', () => ({
	getMonitorSession: vi.fn(),
	MONITOR_COOKIE: 'monitorSession'
}));
vi.mock('$lib/server/monitors/migrate', () => ({ preserveMonitorApprovals: vi.fn() }));

const userModel = User as unknown as {
	find: ReturnType<typeof vi.fn>;
	findById: ReturnType<typeof vi.fn>;
};

function userWithRoutes(routes: string[]) {
	return {
		_id: 'a'.repeat(24),
		username: 'admin',
		isActive: true,
		passwordHash: 'not-returned',
		_branchIds: [],
		_defaultBranchId: {},
		_profileId: {},
		_settingsId: {},
		_roleIds: [{ label: 'Assigned role', routes: routes.map((href) => ({ href })) }]
	};
}

function userQuery(value: ReturnType<typeof userWithRoutes>) {
	return {
		select: () => userQuery(value),
		populate: () => userQuery(value),
		lean: async () => value
	};
}

function context(routeId: string, pathname: string, userId?: string) {
	const event = {
		route: { id: routeId },
		url: new URL(`https://eop.example${pathname}`),
		cookies: { get: (name: string) => (name === 'userId' ? userId : 'b'.repeat(64)) },
		locals: {} as App.Locals,
		setHeaders: vi.fn()
	};
	const resolve = vi.fn(async () => new Response('OK'));
	return { event, resolve };
}

const invoke = (input: ReturnType<typeof context>) =>
	handle(input as unknown as Parameters<typeof handle>[0]);

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(authorizeContent).mockResolvedValue(undefined);
	vi.mocked(getMonitorSession).mockResolvedValue(null);
	userModel.find.mockReturnValue({ lean: async () => [{}] });
	userModel.findById.mockReturnValue(userQuery(userWithRoutes(['/dashboard'])));
});

describe('central monitor authentication', () => {
	it.each([
		['advanceUpsQuote', '/ups/quote'],
		['advanceShippingQuote', '/shipping/quote']
	])(
		'requires feature permission for %s even with a forged public or monitor page URL',
		async (command, permission) => {
			for (const [route, path] of [
				['/(public)/sign-in', '/sign-in'],
				['/(monitors)/monitors/status', '/monitors/status'],
				['/(private)/(padded)/dashboard', '/dashboard']
			]) {
				const input = context(route, path, 'a'.repeat(24));
				Object.assign(input.event, {
					isRemoteRequest: true,
					request: new Request(`https://eop.example/_app/remote/test/${command}`, {
						method: 'POST'
					})
				});
				expect((await invoke(input)).status).toBe(303);
				expect(input.resolve).not.toHaveBeenCalled();
			}
			userModel.findById.mockReturnValue(userQuery(userWithRoutes([permission])));
			const allowed = context(
				'/(private)/(padded)/ups/quote/[quote]',
				'/ups/quote/1234',
				'a'.repeat(24)
			);
			Object.assign(allowed.event, {
				isRemoteRequest: true,
				request: new Request(`https://eop.example/_app/remote/test/${command}`, {
					method: 'POST'
				})
			});
			expect((await invoke(allowed)).status).toBe(200);
			expect(allowed.event.locals.user._id).toBe('a'.repeat(24));
		}
	);
	it('rejects unregistered remote commands and requires login for registered commands', async () => {
		const input = context('/(public)/sign-in', '/sign-in');
		Object.assign(input.event, {
			isRemoteRequest: true,
			request: new Request('https://eop.example/_app/remote/test/unknown', { method: 'POST' })
		});
		expect((await invoke(input)).status).toBe(403);
		Object.assign(input.event, {
			request: new Request('https://eop.example/_app/remote/test/createUpsQuote', {
				method: 'POST'
			})
		});
		expect((await invoke(input)).headers.get('location')).toBe('/sign-in');
		expect(input.resolve).not.toHaveBeenCalled();
	});
	it('keeps pairing and polling public without an employee session', async () => {
		for (const path of ['pair', 'status']) {
			const input = context(`/(monitors)/monitors/${path}`, `/monitors/${path}`);
			expect((await invoke(input)).status).toBe(200);
			expect(input.resolve).toHaveBeenCalled();
			expect(preserveMonitorApprovals).toHaveBeenCalled();
			expect(input.event.setHeaders).toHaveBeenCalledWith({ 'cache-control': 'private, no-store' });
		}
		expect(userModel.find).not.toHaveBeenCalled();
	});

	it('denies display access to missing, revoked, and pending sessions', async () => {
		for (const session of [null, { status: 'pending' }, { status: 'revoked' }]) {
			vi.mocked(getMonitorSession).mockResolvedValue(
				session as Awaited<ReturnType<typeof getMonitorSession>>
			);
			for (const path of ['display', 'playback', 'media/[id]']) {
				const input = context(`/(monitors)/monitors/(approved)/${path}`, `/monitors/${path}`);
				const response = await invoke(input);
				expect(response.status).toBe(303);
				expect(response.headers.get('location')).toBe('/monitors/pair');
				expect(input.resolve).not.toHaveBeenCalled();
			}
		}
	});

	it('allows an approved device only in the monitor group and exposes no employee identity', async () => {
		vi.mocked(getMonitorSession).mockResolvedValue({
			_id: { toString: () => 'monitor-id' },
			status: 'approved',
			location: 'Break room'
		} as unknown as NonNullable<Awaited<ReturnType<typeof getMonitorSession>>>);
		const display = context('/(monitors)/monitors/(approved)/display', '/monitors/display');
		expect((await invoke(display)).status).toBe(200);
		expect(display.event.locals.monitor).toEqual({
			id: 'monitor-id',
			location: 'Break room',
			colorMode: 'dark',
			refreshVersion: 0
		});
		expect(display.event.locals.user).toBeUndefined();
		for (const page of ['approval', 'management']) {
			const admin = context(
				`/(private)/(padded)/admin/monitors/${page}`,
				`/admin/monitors/${page}`
			);
			expect((await invoke(admin)).headers.get('location')).toBe('/sign-in');
			expect(admin.resolve).not.toHaveBeenCalled();
		}
	});

	it.each(['approval', 'management', 'slides', 'playlists'])(
		'uses existing role assignments to protect monitor %s',
		async (page) => {
			const pathname = `/admin/monitors/${page}`;
			const routeId = `/(private)/(padded)${pathname}`;
			const denied = context(routeId, pathname, 'a'.repeat(24));
			expect((await invoke(denied)).headers.get('location')).toBe('/dashboard');
			expect(denied.resolve).not.toHaveBeenCalled();
			userModel.findById.mockReturnValue(userQuery(userWithRoutes([pathname])));
			const allowed = context(routeId, pathname, 'a'.repeat(24));
			expect((await invoke(allowed)).status).toBe(200);
			expect(allowed.resolve).toHaveBeenCalled();
		}
	);
});

describe('central post and form enforcement', () => {
	it('guards canonical posts, legacy news and form data/submissions before resolving routes', async () => {
		for (const [route, path] of [
			['/(public)/(padded)/posts/[year]/[month]/[day]/[slug]', '/posts/2026/10/30/feedback'],
			['/(public)/(padded)/news/[year]/[month]/[day]/[slug]', '/news/2026/10/30/feedback'],
			[
				'/(public)/(padded)/posts/submissions/[postId]/[formSlug]',
				'/posts/submissions/' + 'a'.repeat(24) + '/feedback'
			]
		]) {
			const input = context(route, path);
			vi.mocked(authorizeContent).mockResolvedValue(new Response('Denied', { status: 403 }));
			expect((await invoke(input)).status).toBe(403);
			expect(input.resolve).not.toHaveBeenCalled();
		}
	});
});
