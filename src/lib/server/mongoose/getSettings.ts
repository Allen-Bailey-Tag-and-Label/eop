import { Route, RouteSettings } from './models';
import { type Settings } from './';

export const getSettings = async <T extends { locals: any; url: URL }>({
	locals,
	url
}: T): Promise<Settings> => {
	const route = (await Route.findOne({ href: url.pathname }).lean().exec()) as { _id: string };
	if (!route)
		return {
			_routeId: '',
			columnsOrder: [],
			currentPage: 0,
			filter: [],
			rowsPerPage: 10,
			sortDirection: 'asc',
			sortKey: 'createdAt'
		};

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
			filter: settings?.filter ?? [],
			rowsPerPage: settings?.rowsPerPage ?? 10,
			sortDirection: settings?.sortDirection ?? 'asc',
			sortKey: settings?.sortKey ?? 'createdAt'
		})
	);
};
