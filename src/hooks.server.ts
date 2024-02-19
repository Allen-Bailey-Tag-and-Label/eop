import { hooks } from '$lib/config';
import { prisma } from '$lib/prisma';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// check if route requires authentication
	if (!hooks.unauthenticatedRoutes.includes(event.url.pathname)) {
		// get session_id
		const id = event.cookies.get('session_id');
		if (id === undefined || id === null)
			return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });

		// get user
		const user = await prisma.user.findFirst({
			where: { id },
			include: {
				profile: true,
				roles: {
					include: {
						routes: true
					}
				}
			}
		});
		if (user === undefined || user === null)
			return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });

		user.routes = [
			...new Set(
				user.roles
					.flat()
					.map(({ routes }) => routes.map(({ id, href, label }) => ({ id, href, label })))
					.flat()
			)
		].sort((a, b) => a.label.localeCompare(b.label));
		user.roles = user.roles.map(({ id, label }) => ({ id, label }));

		// remove user keys
		delete user.passwordHash;
		delete user.roleIds;

		// add user to locals
		event.locals.user = user;

		// check if is root route
		if (event.url.pathname === '/')
			return new Response('Redirect', {
				status: 303,
				headers: { Location: user.isOnboarded ? '/dashboard' : '/onboard' }
			});
	}

	// get response from event
	const response = await resolve(event);
	return response;
};
