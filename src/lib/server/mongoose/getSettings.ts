import { Route, RouteSettings } from './models';
import { type Settings } from './';

export const getSettings = async <T extends { locals: any; url: URL }>({
	locals,
	url
}: T): Promise<Settings> => {
	let route = (await Route.findOne({ href: url.pathname }).lean().exec()) as { _id: string } | null;
	if (!route) {
		// A page can be accessible through a parent route permission without having
		// its own record yet. Table preferences still need a distinct, stable route ID.
		route = (await Route.findOneAndUpdate(
			{ href: url.pathname },
			{ $setOnInsert: { href: url.pathname, _createdById: locals.user._id } },
			{
				upsert: true,
				new: true,
				setDefaultsOnInsert: true,
				_createdById: locals.user._id,
				context: 'query'
			}
		)
			.lean()
			.exec()) as { _id: string };
	}

	const settings = (await RouteSettings.findOne({
		_routeId: route._id,
		_userId: locals.user._id
	})
		.lean()
		.exec()) as (Omit<Settings, '_routeId'> & { _id: string }) | null;

	return JSON.parse(
		JSON.stringify({
			_routeId: route._id,
			columnsOrder: settings?.columnsOrder ?? [],
			currentPage: settings?.currentPage ?? 0,
			isPaginateable: settings?.isPaginateable ?? true,
			filter: settings?.filter ?? [],
			rowsPerPage: settings?.rowsPerPage ?? 10,
			sortDirection: settings?.sortDirection ?? 'asc',
			sortKey: settings?.sortKey ?? 'createdAt'
		})
	);
};
