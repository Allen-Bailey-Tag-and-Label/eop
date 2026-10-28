import { describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { setMonitorCookie } from './cookies';

vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('./sessions', () => ({
	MONITOR_COOKIE: 'monitorSession',
	SESSION_DURATION_MS: 90 * 24 * 60 * 60 * 1000
}));

describe('monitor credentials', () => {
	it('uses a persistent, secure, HttpOnly cookie restricted to monitor routes', () => {
		const set = vi.fn();
		const expiry = new Date('2027-01-01T00:00:00Z');
		setMonitorCookie({ set } as unknown as Cookies, 'secret-token', expiry);
		expect(set).toHaveBeenCalledWith('monitorSession', 'secret-token', {
			path: '/monitors',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			expires: expiry
		});
	});
});
