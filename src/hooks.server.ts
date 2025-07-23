import type { Handle } from '@sveltejs/kit';
import { User } from '$lib/server/mongoose/models';
import { type Navigation, type Route } from '$lib/types';
import { Types } from 'mongoose';
import { connect } from '$lib/server/mongoose';

const buildNavigation = (flatRoutes: Route[]): Navigation[] => {
	const routeMap = new Map<number | null, Navigation[]>();

	// Group routes by parentId
	for (const route of flatRoutes) {
		const node: Navigation = { ...route, children: [], isOpen: false };
		const parentKey = route.parentId ?? null;

		if (!routeMap.has(parentKey)) {
			routeMap.set(parentKey, []);
		}

		routeMap.get(parentKey)!.push(node);
	}

	// Recursively attach and sort children
	const attachChildren = (parent: Navigation) => {
		const children = routeMap.get(parent._id) || [];

		// Sort by label
		children.sort((a, b) => a.label.localeCompare(b.label));

		parent.children = children;

		for (const child of children) {
			attachChildren(child);
		}
	};

	const rootRoutes = routeMap.get(null) || [];

	// Sort root routes as well
	rootRoutes.sort((a, b) => a.label.localeCompare(b.label));

	for (const root of rootRoutes) {
		attachChildren(root);
	}

	return rootRoutes;
};

export const handle: Handle = async ({ event, resolve }) => {
	await connect();
	const userIdCookie = event.cookies.get('userId');

	// handle root path
	if (event.url.pathname === '/') {
		if (userIdCookie === undefined) return redirect('/sign-in');
		if (userIdCookie !== undefined) return redirect('/dashboard');
	}

	const userId = new Types.ObjectId(userIdCookie);

	// handle (private) routes
	if (event.route.id?.startsWith('/(private)')) {
		if (userId === undefined) return redirect('/sign-in');
		const userData = JSON.parse(
			JSON.stringify(
				await User.findById(userId)
					.populate({
						path: 'roles',
						populate: {
							path: 'routes'
						}
					})
					.lean()
			)
		);

		if (!userData) {
			// Redirect logic, or respond with error if user not found
			return new Response(null, { status: 302, headers: { Location: '/sign-in' } });
		}

		// Exclude sensitive data and separate user info from roles
		const { passwordHash, roles, ...user } = userData;

		// Flatten routes from each role
		const flatRoutes = roles.flatMap((role: any) => role.routes || []);

		// Redirect if event.url.pathname is not in flatRoutes
		if (!flatRoutes.some((flatRoute) => flatRoute.href === event.url.pathname))
			return redirect('/dashboard');

		// Build navigation hierarchy using your custom function
		const navigation = buildNavigation(flatRoutes);

		// Store in locals or send response as required by your app
		event.locals.user = user;
		event.locals.navigation = navigation;
	}

	const response = await resolve(event);
	return response;
};

const redirect = (location: string) =>
	new Response('Redirect', { status: 303, headers: { location } });
