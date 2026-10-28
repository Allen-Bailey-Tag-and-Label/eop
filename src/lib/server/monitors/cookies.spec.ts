import { describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { MONITOR_COOKIE_MAX_AGE, setMonitorCookie } from './cookies';

vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('./sessions', () => ({
	MONITOR_COOKIE: 'monitorSession'
}));

describe('monitor credentials', () => {
	it('uses a persistent, secure, HttpOnly cookie restricted to monitor routes', () => {
		const set = vi.fn();
		setMonitorCookie({ set } as unknown as Cookies, 'secret-token');
		expect(set).toHaveBeenCalledWith('monitorSession', 'secret-token', {
			path: '/monitors',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: MONITOR_COOKIE_MAX_AGE
		});
	});
});
