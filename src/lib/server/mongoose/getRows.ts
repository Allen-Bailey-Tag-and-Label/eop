import { connect, type Model, type Query, type Settings, type Sort } from './';

type ModelParams<T> = {
	model: Model<T>;
	settings: Omit<Settings, 'filter'> & { mongoFilter: Record<string, any> };
};
type QueryParams<T> = {
	query: () => Query<T[], T>;
	settings: Omit<Settings, 'filter'> & { mongoFilter: Record<string, any> };
};
type Params<T> = ModelParams<T> | QueryParams<T>;

export const getRows = async <T>(params: Params<T>): Promise<T[]> => {
	await connect();

	const { currentPage, mongoFilter, rowsPerPage, sortDirection, sortKey } = params.settings;
	const skip = currentPage * rowsPerPage;
	const sort: Sort = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

	let query: Query<T[], T>;
	if ('query' in params) {
		// Apply filter on top of the caller's base query
		query = params.query().find(mongoFilter).sort(sort).skip(skip).limit(rowsPerPage);
	} else {
		query = params.model.find(mongoFilter).sort(sort).skip(skip).limit(rowsPerPage);
	}

	const rows = await query.lean().exec();
	return JSON.parse(JSON.stringify(rows));
};
