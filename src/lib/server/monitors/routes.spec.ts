import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { load as pair } from '../../../routes/(monitors)/monitors/pair/+page.server';
import { GET as status } from '../../../routes/(monitors)/monitors/status/+server';
import { actions } from '../../../routes/(private)/(padded)/admin/monitors/+page.server';
import { setMonitorCookie } from './cookies';
import {
	approveMonitor,
	getMonitorSession,
	PairingLimitError,
	requestPairing,
	revokeMonitor
} from './sessions';

vi.mock('./cookies', () => ({ setMonitorCookie: vi.fn() }));
vi.mock('./sessions', () => ({
	MONITOR_COOKIE: 'monitorSession',
	PairingLimitError: class extends Error {},
	requestPairing: vi.fn(),
	getMonitorSession: vi.fn(),
	touchMonitor: vi.fn(),
	approveMonitor: vi.fn(),
	revokeMonitor: vi.fn(),
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
		request: new Request('https://eop.example/admin/monitors', { method: 'POST', body })
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
	it('returns the readable pairing code without exposing the secret or its hash to the page', async () => {
		const input = event();
		const data = await pair(input as unknown as Parameters<typeof pair>[0]);
		expect(data).toEqual({
			code: 'ABCD-EFGH',
			expiresAt: session.expiresAt.toISOString(),
			approvalUrl: 'https://eop.example/admin/monitors'
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
		vi.mocked(getMonitorSession).mockResolvedValue({ ...session, status: 'approved' });
		const input = event();
		const response = await status(input as unknown as Parameters<typeof status>[0]);
		expect(getMonitorSession).toHaveBeenCalledWith(token);
		expect(await response.json()).toEqual({ state: 'approved' });
		expect(setMonitorCookie).toHaveBeenCalledWith(input.cookies, token, session.expiresAt);
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
		const approve = actions.approve!;
		expect(await approve(input as unknown as Parameters<typeof approve>[0])).toEqual({
			success: 'Monitor approved for Break room.'
		});
		expect(approveMonitor).toHaveBeenCalledWith('ABCD-EFGH', 'Break room', 'a'.repeat(24));
	});

	it('reports invalid approvals and missing revocations as form errors', async () => {
		const approve = actions.approve!;
		const revoke = actions.revoke!;
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
