import { type Handle } from '@sveltejs/kit';
import { hashSync } from 'bcryptjs';
import { Types } from 'mongoose';
import { INIT_ADMIN_PASSWORD, INIT_ADMIN_USERNAME } from '$env/static/private';
import { connect } from '$lib/server/mongoose';
import { setSkipLogging } from '$lib/server/mongoose/middleware';
import { Log, Role, Route, UpsQuote, User } from '$lib/server/mongoose/models';
import { type Navigation, type Route as RouteType } from '$lib/types';

const buildNavigation = (flatRoutes: RouteType[]): Navigation[] => {
	const routeMap = new Map<string | null, Navigation[]>();

	// Group routes by _parentId
	for (const route of flatRoutes) {
		const node: Navigation = { ...route, children: [], isOpen: false };
		const parentKey = route._parentId ?? null;

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

const initDB = async () => {
	try {
		// exit if we already have a user
		const isUserPresent = (await User.find().lean()).length > 0;
		if (isUserPresent) return;

		// disabled logging for init
		setSkipLogging(true);

		// delete all existing docs
		await Promise.all([
			Log.deleteMany(),
			Role.deleteMany(),
			Route.deleteMany(),
			UpsQuote.deleteMany(),
			User.deleteMany()
		]);

		// create admin user
		const passwordHash = hashSync(INIT_ADMIN_PASSWORD);
		const adminUser = await User.create({
			isActive: true,
			passwordHash,
			username: INIT_ADMIN_USERNAME
		});

		// re-enable logging for everything else
		setSkipLogging(false);

		// create routes
		const adminRoute = await Route.create({
			_createdById: adminUser._id,
			isDirectory: true,
			label: 'Admin'
		});
		const allOtherRoutes = await Promise.all([
			Route.create({ _createdById: adminUser._id, href: '/dashboard', label: 'Dashboard' }),
			Route.create({
				_createdById: adminUser._id,
				_parentId: adminRoute._id,
				href: '/admin/roles',
				label: 'Roles'
			}),
			Route.create({
				_createdById: adminUser._id,
				_parentId: adminRoute._id,
				href: '/admin/routes',
				label: 'Routes'
			})
		]);

		// create roles
		const adminRole = await Role.create({
			_createdById: adminUser._id,
			label: 'Admin',
			routes: [adminRoute._id, ...allOtherRoutes.map((route) => route._id)]
		});
		await User.findOneAndUpdate(
			{ username: adminUser.username },
			{ _createdById: adminUser._id, _roleIds: [adminRole._id] }
		);
	} catch (error) {
		console.log(error);
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	await connect();
	await initDB();

	const userIdCookie = event.cookies.get('userId');

	// handle root path
	if (event.url.pathname === '/') {
		if (userIdCookie === undefined) return redirect('/sign-in');
		if (userIdCookie !== undefined) return redirect('/dashboard');
	}

	// handle (private) routes
	if (event.route.id?.startsWith('/(private)')) {
		if (userIdCookie === undefined || userIdCookie === '') return redirect('/sign-in');

		const userId = new Types.ObjectId(userIdCookie);

		if (userId === undefined) return redirect('/sign-in');
		const {
			_branchIds,
			_defaultBranchId,
			_profileId,
			_roleIds,
			_settingsId,
			...rawData
		}: {
			_id: string;
			_branchIds: { _id: string; label: string; number: number }[];
			_defaultBranchId: { _id: string; label: string; number: number };
			_profileId: {
				_id: string;
				email: string;
				firstName: string;
				lastName: string;
				phone: number;
			};
			_roleIds: { label: string; routes: RouteType[] }[];
			_settingsId: {
				_id: string;
				magnification: number;
			};
			isActive: boolean;
			passwordHash: string;
			username: string;
		} = JSON.parse(
			JSON.stringify(
				await User.findById(userId)
					.select('-_createdById -createdAt -updatedAt')
					.populate({
						path: '_branchIds',
						select: '-_createdById -createdAt -updatedAt'
					})
					.populate({
						path: '_defaultBranchId',
						select: '-_createdById -createdAt -updatedAt'
					})
					.populate({
						path: '_roleIds',
						populate: {
							path: 'routes'
						}
					})
					.populate({
						path: '_profileId',
						select: '-_createdById -createdAt -updatedAt'
					})
					.populate({
						path: '_settingsId',
						select: '-_createdById -createdAt -updatedAt'
					})
					.lean()
			)
		);

		if (!rawData) {
			// Redirect logic, or respond with error if user not found
			return new Response(null, { status: 302, headers: { Location: '/sign-in' } });
		}

		const userData = {
			...rawData,
			branches: _branchIds,
			defaultBranch: _defaultBranchId,
			roles: _roleIds,
			profile: _profileId,
			settings: _settingsId
		};

		// Exclude sensitive data and separate user info from roles
		const { passwordHash, roles, ...user } = userData;

		// Flatten and deduplicate routes by _id
		const routeMap = new Map<string, RouteType>();
		for (const role of roles) {
			for (const route of role.routes || []) {
				if (route && route._id) {
					routeMap.set(route._id.toString(), route);
				}
			}
		}
		const flatRoutes = Array.from(routeMap.values());

		const isMatch = flatRoutes.some((route) => {
			const routeHref = route.href;
			const pathname = event.url.pathname;

			// Exact match
			if (pathname === routeHref) return true;

			// Slug or subpath match (with safe prefix check)
			return pathname.startsWith(routeHref + '/');
		});

		// Redirect if event.url.pathname is not in flatRoutes
		if (!isMatch && !event.url.pathname.startsWith('/api')) return redirect('/dashboard');

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
