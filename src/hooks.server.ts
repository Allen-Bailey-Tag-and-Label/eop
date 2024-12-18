import { prisma } from '$lib/prisma';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = event.cookies.get('userId');
	const user = userId
		? await prisma.user.findUnique({
				where: { id: userId },
				include: { profile: true, roles: { include: { routes: true } } }
			})
		: null;

	const allowedPathnames = new Set();
	const navigation: Map<string, Map<string, string>> = new Map();

	(user?.roles || []).forEach(({ routes }) =>
		routes.forEach(({ href, group, label }) => {
			allowedPathnames.add(href);
			if (!navigation.has(group)) navigation.set(group, new Map());
			const groupMap = navigation.get(group) || new Map();
			groupMap.set(href, label);
			navigation.set(group, groupMap);
		})
	);
	event.locals.navigation = navigation;
	if (user) event.locals.user = user;

	if (event.url.pathname === '/') {
		if (!userId) return new Response(null, { status: 303, headers: { location: '/sign-in' } });
		if (user?.isActive)
			return new Response(null, { status: 303, headers: { location: '/dashboard' } });
	}

	if (event.route.id?.startsWith('/(authenticated)')) {
		if (!userId || !(user?.isActive || false) || !allowedPathnames.has(event.url.pathname))
			return new Response(null, { status: 303, headers: { location: '/sign-in' } });
	}

	const response = await resolve(event);
	return response;
};
