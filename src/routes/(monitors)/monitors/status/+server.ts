import { json } from '@sveltejs/kit';
import { setMonitorCookie } from '$lib/server/monitors/cookies';
import { getMonitorSession, MONITOR_COOKIE, touchMonitor } from '$lib/server/monitors/sessions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get(MONITOR_COOKIE);
	const session = await getMonitorSession(token);
	if (!session) return json({ state: 'unpaired' });
	if (session.status === 'approved') {
		await touchMonitor(session._id);
		setMonitorCookie(cookies, token!);
	}
	return json({
		state: session.status,
		...(session.status === 'approved'
			? {
					refreshVersion: session.refreshVersion ?? 0,
					playlistId: session.playlistId?.toString() ?? '',
					navigationCommands: session.navigationCommands ?? []
				}
			: {})
	});
};
