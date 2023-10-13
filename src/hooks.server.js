import jsonwebtoken from 'jsonwebtoken';
import { JSONWEBTOKEN_SECRET } from '$env/static/private';
import { prisma } from '$lib/prisma';
import { request } from '@playwright/test';

export async function handle({ event, resolve }) {
	// create list of unathenticated routes
	const unathenticatedRoutes = ['/sign-in', '/forgot-password'];
	try {
		// get token from cookies
		const token = event.cookies.get('token');

		// check if token is undefined
		if (token === undefined) throw `'token' cookie missing`;

		// decode token
		const { id: userId } = jsonwebtoken.verify(token, JSONWEBTOKEN_SECRET);

		// find user
		const user = await prisma.user.findFirst({
			where: { id: userId, isActive: true },
			include: { profile: true }
		});

		// update locals
		event.locals.user = user;

		// check if route is an unathenticated route
		if (unathenticatedRoutes.includes(event.url.pathname) || event.url.pathname === '/')
			return new Response('Redirect', { status: 303, headers: { Location: '/dashboard' } });
	} catch (error) {
		console.log(error);
		if (!unathenticatedRoutes.includes(event.url.pathname))
			return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });
	}

	const response = await resolve(event);
	return response;
}
