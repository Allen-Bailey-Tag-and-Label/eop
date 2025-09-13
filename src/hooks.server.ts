import { type Handle } from '@sveltejs/kit';
import { hashSync } from 'bcryptjs';
import { Types } from 'mongoose';
import { INIT_ADMIN_PASSWORD, INIT_ADMIN_USERNAME } from '$env/static/private';
import { connect } from '$lib/server/mongoose';
import { setSkipLogging } from '$lib/server/mongoose/middleware';
import { Log, Role, Route, UpsQuote, User } from '$lib/server/mongoose/models';
import { type Navigation, type Route as RouteType } from '$lib/types';

type NavigationMap = Map<string, NavigationMap>;
type Role = { label: string; routes: RouteType[] };

const buildNavigationMap = (roles: Role[]): NavigationMap => {
	const set = (route: RouteType) => {
		const hrefSegments = route.href === '/' ? [] : route.href.slice(1).split('/');

		let node = navigationMap;

		for (const hrefSegment of hrefSegments) {
			node = upsert({ hrefSegment, node });
		}
	};
	const upsert = ({ hrefSegment, node }: { hrefSegment: string; node: NavigationMap }) => {
		let childNode = node.get(hrefSegment);
		if (!childNode) {
			childNode = new Map();
			node.set(hrefSegment, childNode);
		}
		return childNode;
	};

	const navigationMap: NavigationMap = new Map();

	for (const role of roles) {
		for (const route of role.routes) set(route);
	}

	return navigationMap;
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
			_roleIds: Role[];
			_settingsId: {
				_id: string;
				magnification: number;
				theme: string;
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

		const navigationMap = buildNavigationMap(roles);
		const navigation = navigationMapToArray({ currentPath: event.url.pathname, navigationMap });

		const isMatch = navigation.some((route) => {
			const routeHref = route.href;
			const pathname = event.url.pathname;

			// Exact match
			if (pathname === routeHref) return true;

			// Slug or subpath match (with safe prefix check)
			return pathname.startsWith(routeHref + '/');
		});

		// Redirect if event.url.pathname is not in flatRoutes
		if (!isMatch && !event.url.pathname.startsWith('/api')) return redirect('/dashboard');

		event.locals.navigation = navigation;
		event.locals.user = user;
	}

	const response = await resolve(event);
	return response;
};

const navigationMapToArray = ({
	currentPath,
	navigationMap
}: {
	currentPath: string;
	navigationMap: NavigationMap;
}): Navigation[] => {
	const walk = ({
		baseHref,
		navigationMap
	}: {
		baseHref: string;
		navigationMap: NavigationMap;
	}): Navigation[] => {
		const navigation: Navigation[] = [];

		for (const [hrefSegment, childMap] of navigationMap) {
			const href = baseHref === '/' ? `/${hrefSegment}` : `${baseHref}/${hrefSegment}`;
			const label = hrefSegment
				.split('-')
				.map((word) => word[0].toUpperCase() + word.slice(1))
				.join(' ');

			const children = walk({ baseHref: href, navigationMap: childMap });

			let isOpen = href === currentPath;
			if (!isOpen) {
				isOpen = children.some((child) => child.isOpen);
			}

			navigation.push({
				label,
				href,
				children,
				isOpen
			});
		}

		navigation.sort((a, b) => a.label.localeCompare(b.label));

		return navigation;
	};

	const navigation = walk({ baseHref: '/', navigationMap });

	return navigation;
};

const redirect = (location: string) =>
	new Response('Redirect', { status: 303, headers: { location } });
