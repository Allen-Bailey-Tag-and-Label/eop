import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = event.cookies.get('userId');

	// handle root path
	if (event.url.pathname === '/') {
		if (userId === undefined)
			return new Response('Redirect', { status: 303, headers: { location: '/sign-in' } });
	}
	const response = await resolve(event);
	return response;
};
