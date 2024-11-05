import { prisma } from '$lib/prisma';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = event.cookies.get('userId');
	const user = userId
		? await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
		: null;

	if (user) event.locals.user = user;

	if (event.url.pathname === '/') {
		if (!userId) return new Response(null, { status: 303, headers: { location: '/sign-in' } });
		if (user?.active)
			return new Response(null, { status: 303, headers: { location: '/dashboard' } });
	}

	const response = await resolve(event);
	return response;
};
