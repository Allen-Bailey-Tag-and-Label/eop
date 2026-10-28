import { error, redirect } from '@sveltejs/kit';
import { setMonitorCookie } from '$lib/server/monitors/cookies';
import { MONITOR_COOKIE, PairingLimitError, requestPairing } from '$lib/server/monitors/sessions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, getClientAddress, setHeaders, url }) => {
	let pairing;
	try {
		pairing = await requestPairing(cookies.get(MONITOR_COOKIE), getClientAddress());
	} catch (cause) {
		if (!(cause instanceof PairingLimitError)) throw cause;
		setHeaders({ 'retry-after': '600' });
		error(429, cause.message);
	}
	if (pairing.session.status === 'approved') redirect(303, '/monitors/display');
	setMonitorCookie(cookies, pairing.token);
	const code = pairing.session.pairingCode!;
	return {
		code: `${code.slice(0, 4)}-${code.slice(4)}`,
		expiresAt: pairing.session.expiresAt!.toISOString(),
		approvalUrl: `${url.origin}/admin/monitors/approval`
	};
};
