import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { load as pair } from '../../../routes/(monitors)/monitors/pair/+page.server';
import { GET as status } from '../../../routes/(monitors)/monitors/status/+server';
import { POST as acknowledge } from '../../../routes/(monitors)/monitors/(approved)/commands/+server';
import { load as monitorIndex } from '../../../routes/(private)/(padded)/admin/monitors/+page.server';
import { actions as approvalActions } from '../../../routes/(private)/(padded)/admin/monitors/approval/+page.server';
import {
	actions as managementActions,
	load as management
} from '../../../routes/(private)/(padded)/admin/monitors/management/+page.server';
import { setMonitorCookie } from './cookies';
import {
	approveMonitor,
	getMonitorSession,
	listMonitors,
	PairingLimitError,
	requestPairing,
	requestMonitorRefresh,
	requestMonitorNavigation,
	acknowledgeMonitorNavigation,
	revokeMonitor,
	setMonitorColorMode
} from './sessions';

vi.mock('./cookies', () => ({ setMonitorCookie: vi.fn() }));
vi.mock('$lib/server/slides/content', () => ({
	listPlaylists: vi.fn(async () => []),
	assignPlaylist: vi.fn()
}));
vi.mock('./sessions', () => ({
	MONITOR_COOKIE: 'monitorSession',
	PairingLimitError: class extends Error {},
	requestPairing: vi.fn(),
	requestMonitorRefresh: vi.fn(),
	requestMonitorNavigation: vi.fn(),
	acknowledgeMonitorNavigation: vi.fn(),
	getMonitorSession: vi.fn(),
	touchMonitor: vi.fn(),
	approveMonitor: vi.fn(),
	revokeMonitor: vi.fn(),
	setMonitorColorMode: vi.fn(),
	listMonitors: vi.fn()
}));

const token = 'b'.repeat(64);
const session = {
	__v: 0,
	_id: new Types.ObjectId(),
	tokenHash: 'never-public',
	pairingCode: 'ABCDEFGH',
	status: 'pending' as const,
	location: '',
	expiresAt: new Date('2026-10-28T12:10:00Z')
};

function event(fields: Record<string, string> = {}) {
	const body = new FormData();
	for (const [name, value] of Object.entries(fields)) body.set(name, value);
	return {
		cookies: { get: vi.fn(() => token) },
		getClientAddress: () => '192.0.2.1',
		setHeaders: vi.fn(),
		url: new URL('https://eop.example/monitors/pair'),
		locals: { user: { _id: 'a'.repeat(24) } },
		request: new Request('https://eop.example/admin/monitors/approval', { method: 'POST', body })
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requestPairing).mockResolvedValue({ token, session } as Awaited<
		ReturnType<typeof requestPairing>
	>);
	vi.mocked(getMonitorSession).mockResolvedValue(null);
	vi.mocked(approveMonitor).mockResolvedValue(null);
	vi.mocked(revokeMonitor).mockResolvedValue(false);
});

describe('monitor route wiring', () => {
	it('queues the submitted direction for the selected monitor and assignment', async () => {
		const navigate = managementActions.navigate!;
		const fields = {
			sessionId: session._id.toString(),
			playlistId: 'c'.repeat(24),
			direction: 'prev'
		};
		vi.mocked(requestMonitorNavigation).mockResolvedValue(false);
		expect(await navigate(event(fields) as never)).toMatchObject({ status: 400 });
		vi.mocked(requestMonitorNavigation).mockResolvedValue(true);
		expect(await navigate(event(fields) as never)).toHaveProperty('success');
		expect(requestMonitorNavigation).toHaveBeenLastCalledWith(
			fields.sessionId,
			'prev',
			fields.playlistId
		);
	});
	it('acknowledges commands using only the monitor identity supplied by the hook', async () => {
		const ids = ['d'.repeat(32)];
		vi.mocked(acknowledgeMonitorNavigation).mockResolvedValue(true);
		const input = {
			locals: { monitor: { id: session._id.toString() } },
			request: new Request('https://eop.example/monitors/commands', {
				method: 'POST',
				body: JSON.stringify({ ids, monitorId: 'a'.repeat(24) })
			})
		};
		expect((await acknowledge(input as never)).status).toBe(200);
		expect(acknowledgeMonitorNavigation).toHaveBeenLastCalledWith(session._id.toString(), ids);
		vi.mocked(acknowledgeMonitorNavigation).mockResolvedValue(false);
		expect(
			(
				await acknowledge({
					...input,
					request: new Request('https://eop.example/monitors/commands', {
						method: 'POST',
						body: '{}'
					})
				} as never)
			).status
		).toBe(400);
	});
	it('queues a refresh for the submitted monitor without changing assignments or access', async () => {
		vi.mocked(requestMonitorRefresh).mockResolvedValue(false);
		const refresh = managementActions.refresh!;
		expect(
			await refresh(event({ sessionId: 'invalid' }) as unknown as Parameters<typeof refresh>[0])
		).toMatchObject({ status: 400 });
		vi.mocked(requestMonitorRefresh).mockResolvedValue(true);
		expect(
			await refresh(
				event({ sessionId: session._id.toString() }) as unknown as Parameters<typeof refresh>[0]
			)
		).toHaveProperty('success');
		expect(requestMonitorRefresh).toHaveBeenLastCalledWith(session._id.toString());
		expect(revokeMonitor).not.toHaveBeenCalled();
	});
	it('delivers the persistent refresh version only to its own approved device', async () => {
		vi.mocked(getMonitorSession).mockResolvedValue({
			...session,
			status: 'approved',
			refreshVersion: 3,
			expiresAt: undefined
		});
		const response = await status(event() as unknown as Parameters<typeof status>[0]);
		expect(await response.json()).toEqual({
			state: 'approved',
			refreshVersion: 3,
			playlistId: '',
			navigationCommands: []
		});
		expect(getMonitorSession).toHaveBeenCalledWith(token);
		vi.mocked(getMonitorSession).mockResolvedValue(session);
		expect(await (await status(event() as unknown as Parameters<typeof status>[0])).json()).toEqual(
			{ state: 'pending' }
		);
	});
	it('validates and saves monitor color mode through the management action', async () => {
		vi.mocked(setMonitorColorMode).mockResolvedValue(false);
		const input = event({ sessionId: 'a'.repeat(24), colorMode: 'system' });
		expect(
			await managementActions.colorMode(
				input as unknown as Parameters<typeof managementActions.colorMode>[0]
			)
		).toMatchObject({ status: 400 });
		vi.mocked(setMonitorColorMode).mockResolvedValue(true);
		const saved = event({ sessionId: 'a'.repeat(24), colorMode: 'light' });
		expect(
			await managementActions.colorMode(
				saved as unknown as Parameters<typeof managementActions.colorMode>[0]
			)
		).toHaveProperty('success');
		expect(setMonitorColorMode).toHaveBeenLastCalledWith('a'.repeat(24), 'light');
	});
	it('redirects old admin bookmarks to approval', () => {
		expect(() => monitorIndex()).toThrow(
			expect.objectContaining({
				status: 303,
				location: '/admin/monitors/approval'
			})
		);
	});

	it('loads approved monitors on the management page', async () => {
		const monitors = [
			{
				id: session._id.toString(),
				location: 'Break room',
				approvedAt: null,
				lastSeenAt: null,
				playlistId: '',
				colorMode: 'dark' as const
			}
		];
		vi.mocked(listMonitors).mockResolvedValue(monitors);
		expect(await management(event() as unknown as Parameters<typeof management>[0])).toEqual({
			monitors,
			playlists: []
		});
	});

	it('returns the readable pairing code without exposing the secret or its hash to the page', async () => {
		const input = event();
		const data = await pair(input as unknown as Parameters<typeof pair>[0]);
		expect(data).toEqual({
			code: 'ABCD-EFGH',
			expiresAt: session.expiresAt.toISOString(),
			approvalUrl: 'https://eop.example/admin/monitors/approval'
		});
		expect(setMonitorCookie).toHaveBeenCalledWith(input.cookies, token);
		expect(JSON.stringify(data)).not.toContain(token);
		expect(JSON.stringify(data)).not.toContain(session.tokenHash);
	});

	it('redirects already approved browsers to the display and reports creation limits', async () => {
		vi.mocked(requestPairing).mockResolvedValue({
			token,
			session: { ...session, status: 'approved' }
		} as Awaited<ReturnType<typeof requestPairing>>);
		await expect(pair(event() as unknown as Parameters<typeof pair>[0])).rejects.toMatchObject({
			status: 303,
			location: '/monitors/display'
		});
		vi.mocked(requestPairing).mockRejectedValue(new PairingLimitError());
		const input = event();
		await expect(pair(input as unknown as Parameters<typeof pair>[0])).rejects.toMatchObject({
			status: 429
		});
		expect(input.setHeaders).toHaveBeenCalledWith({ 'retry-after': '600' });
	});

	it('polls only the requesting browser and returns state without session data', async () => {
		vi.mocked(getMonitorSession).mockResolvedValue({
			...session,
			status: 'approved',
			expiresAt: undefined
		});
		const input = event();
		const response = await status(input as unknown as Parameters<typeof status>[0]);
		expect(getMonitorSession).toHaveBeenCalledWith(token);
		expect(await response.json()).toEqual({
			state: 'approved',
			refreshVersion: 0,
			playlistId: '',
			navigationCommands: []
		});
		expect(setMonitorCookie).toHaveBeenCalledWith(input.cookies, token);
	});

	it('returns an unpaired state for an expired or revoked credential', async () => {
		const response = await status(event() as unknown as Parameters<typeof status>[0]);
		expect(await response.json()).toEqual({ state: 'unpaired' });
		expect(setMonitorCookie).not.toHaveBeenCalled();
	});

	it('passes the entered code, location, and authenticated approver to the service', async () => {
		const input = event({ code: 'ABCD-EFGH', location: 'Break room' });
		vi.mocked(approveMonitor).mockResolvedValue({
			...session,
			status: 'approved',
			location: 'Break room'
		});
		const approve = approvalActions.approve!;
		expect(await approve(input as unknown as Parameters<typeof approve>[0])).toEqual({
			success: 'Monitor approved for Break room.'
		});
		expect(approveMonitor).toHaveBeenCalledWith('ABCD-EFGH', 'Break room', 'a'.repeat(24));
	});

	it('reports invalid approvals and missing revocations as form errors', async () => {
		const approve = approvalActions.approve!;
		const revoke = managementActions.revoke!;
		expect(await approve(event() as unknown as Parameters<typeof approve>[0])).toMatchObject({
			status: 400
		});
		expect(
			await revoke(event({ sessionId: 'invalid' }) as unknown as Parameters<typeof revoke>[0])
		).toMatchObject({ status: 400 });
		vi.mocked(revokeMonitor).mockResolvedValue(true);
		expect(
			await revoke(
				event({ sessionId: session._id.toString() }) as unknown as Parameters<typeof revoke>[0]
			)
		).toHaveProperty('success');
	});
});
