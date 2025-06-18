import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { type Navigation, type Route } from '$lib/types';

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
		const children = routeMap.get(parent.id) || [];

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
	const userId = event.cookies.get('userId');

	// handle root path
	if (event.url.pathname === '/') {
		if (userId === undefined) return redirect('/sign-in');
		if (userId !== undefined) return redirect('/dashboard');
	}

	// handle (private) routes
	if (event.route.id?.startsWith('/(private)')) {
		if (userId === undefined) return redirect('/sign-in');
		const userData = await db.query.user.findFirst({
			where: (u, { eq }) => eq(u.id, +userId),
			with: {
				roles: {
					with: {
						role: {
							with: {
								routes: {
									with: {
										route: true
									}
								}
							}
						}
					}
				}
			}
		});
		if (!userData) return redirect('/sign-in');
		const { passwordHash, roles, ...user } = userData;
		event.locals.user = user;
		const flatRoutes = roles.flatMap((ur) => ur.role.routes.map((rr) => rr.route));
		const navigation = buildNavigation(flatRoutes);
		event.locals.navigation = navigation;
	}

	const response = await resolve(event);
	return response;
};

const redirect = (location: string) =>
	new Response('Redirect', { status: 303, headers: { location } });
