import { connect, type Filter, type Model, type Query, type Settings, type Sort } from './';

type ModelParams<T> = {
	model: Model<T>;
	settings: Settings;
	filter?: Filter;
};
type Params<T> = ModelParams<T> | QueryParams<T>;
type QueryParams<T> = {
	query: () => Query<T[], T>;
	settings: Settings;
};

export const getRows = async <T>(params: Params<T>): Promise<T[]> => {
	await connect();

	const { currentPage, rowsPerPage, sortDirection, sortKey } = params.settings;
	const skip = currentPage * rowsPerPage;
	const sort: Sort = {
		[sortKey]: sortDirection === 'asc' ? 1 : -1
	};

	let query: Query<T[], T>;

	if ('query' in params) {
		query = params.query().sort(sort).skip(skip).limit(rowsPerPage);
	} else {
		query = params.model
			.find(params.filter || {})
			.sort(sort)
			.skip(skip)
			.limit(rowsPerPage);
	}

	const rows = await query.lean().exec();
	return JSON.parse(JSON.stringify(rows));
};
