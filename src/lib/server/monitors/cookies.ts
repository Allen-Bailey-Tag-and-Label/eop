import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { MONITOR_COOKIE } from './sessions';

// Browsers cap cookie lifetimes. Each successful approved status poll renews it.
export const MONITOR_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export function setMonitorCookie(cookies: Cookies, token: string) {
	cookies.set(MONITOR_COOKIE, token, {
		path: '/monitors',
		httpOnly: true,
		secure: !dev,
		sameSite: 'strict',
		maxAge: MONITOR_COOKIE_MAX_AGE
	});
}
