import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/') {
		if (!event.cookies.get('userId'))
			return new Response(null, { status: 303, headers: { location: '/sign-in' } });
	}

	const response = await resolve(event);
	return response;
};
