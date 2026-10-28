import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server';
import { getMonitorSession } from '$lib/server/monitors/sessions';
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
	vi.mocked(getMonitorSession).mockResolvedValue(null);
	userModel.find.mockReturnValue({ lean: async () => [{}] });
	userModel.findById.mockReturnValue(userQuery(userWithRoutes(['/dashboard'])));
});

describe('central monitor authentication', () => {
	it('keeps pairing and polling public without an employee session', async () => {
		for (const path of ['pair', 'status']) {
			const input = context(`/(monitors)/monitors/${path}`, `/monitors/${path}`);
			expect((await invoke(input)).status).toBe(200);
			expect(input.resolve).toHaveBeenCalled();
			expect(input.event.setHeaders).toHaveBeenCalledWith({ 'cache-control': 'private, no-store' });
		}
		expect(userModel.find).not.toHaveBeenCalled();
	});

	it('denies display access to missing, expired, revoked, and pending sessions', async () => {
		for (const session of [null, { status: 'pending' }, { status: 'revoked' }]) {
			vi.mocked(getMonitorSession).mockResolvedValue(
				session as Awaited<ReturnType<typeof getMonitorSession>>
			);
			const input = context('/(monitors)/monitors/(approved)/display', '/monitors/display');
			const response = await invoke(input);
			expect(response.status).toBe(303);
			expect(response.headers.get('location')).toBe('/monitors/pair');
			expect(input.resolve).not.toHaveBeenCalled();
		}
	});

	it('allows an approved device only in the monitor group and exposes no employee identity', async () => {
		vi.mocked(getMonitorSession).mockResolvedValue({
			_id: { toString: () => 'monitor-id' },
			status: 'approved',
			location: 'Break room',
			expiresAt: new Date('2027-01-01T00:00:00Z')
		} as unknown as NonNullable<Awaited<ReturnType<typeof getMonitorSession>>>);
		const display = context('/(monitors)/monitors/(approved)/display', '/monitors/display');
		expect((await invoke(display)).status).toBe(200);
		expect(display.event.locals.monitor).toEqual({
			id: 'monitor-id',
			location: 'Break room',
			expiresAt: '2027-01-01T00:00:00.000Z'
		});
		expect(display.event.locals.user).toBeUndefined();
		const admin = context('/(private)/(padded)/admin/monitors', '/admin/monitors');
		expect((await invoke(admin)).headers.get('location')).toBe('/sign-in');
		expect(admin.resolve).not.toHaveBeenCalled();
	});

	it('uses existing role assignments to protect admin approval pages and actions', async () => {
		const denied = context('/(private)/(padded)/admin/monitors', '/admin/monitors', 'a'.repeat(24));
		expect((await invoke(denied)).headers.get('location')).toBe('/dashboard');
		expect(denied.resolve).not.toHaveBeenCalled();
		userModel.findById.mockReturnValue(userQuery(userWithRoutes(['/admin/monitors'])));
		const allowed = context(
			'/(private)/(padded)/admin/monitors',
			'/admin/monitors',
			'a'.repeat(24)
		);
		expect((await invoke(allowed)).status).toBe(200);
		expect(allowed.resolve).toHaveBeenCalled();
	});
});
