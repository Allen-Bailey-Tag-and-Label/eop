import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { MONITOR_COOKIE, SESSION_DURATION_MS } from './sessions';

export function setMonitorCookie(cookies: Cookies, token: string, expiresAt?: Date) {
	cookies.set(MONITOR_COOKIE, token, {
		path: '/monitors',
		httpOnly: true,
		secure: !dev,
		sameSite: 'strict',
		expires: expiresAt ?? new Date(Date.now() + SESSION_DURATION_MS)
	});
}
