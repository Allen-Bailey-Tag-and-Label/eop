import { json } from '@sveltejs/kit';
import { acknowledgeMonitorNavigation } from '$lib/server/monitors/sessions';
import type { RequestHandler } from './$types';

// The approved-monitor hook supplies the identity; clients cannot acknowledge another device.
export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid command acknowledgment.' }, { status: 400 });
	}
	const ids = body && typeof body === 'object' && 'ids' in body ? body.ids : undefined;
	if (!(await acknowledgeMonitorNavigation(locals.monitor!.id, ids)))
		return json({ error: 'Invalid command acknowledgment.' }, { status: 400 });
	return json({ success: true });
};
