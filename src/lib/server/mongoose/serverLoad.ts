import type { ServerLoadEvent } from '@sveltejs/kit';
import {
	applyColumnsOrder,
	connect,
	filtersToMongoQuery,
	getColumns,
	getRows,
	getSettings,
	type LabelFunctionMap,
	type Model,
	type Query
} from './';

type ModelParams<T> = {
	labelFunctionMap?: LabelFunctionMap;
	model: Model<T>;
	omitColumns?: string[];
};
type Params<T> = ModelParams<T> | QueryParams<T>;
type QueryParams<T> = {
	labelFunctionMap?: LabelFunctionMap;
	model: Model<T>;
	omitColumns?: string[];
	query: () => Query<T[], T>;
};

export const serverLoad = <T>(params: Params<T>) => {
	return async ({ locals, url }: ServerLoadEvent) => {
		await connect();

		const [columnsUnsorted, settings] = await Promise.all([
			params.model
				? getColumns({
						labelFunctionMap: params.labelFunctionMap,
						model: params.model,
						omitColumns: params.omitColumns ?? []
					})
				: [],
			getSettings({ locals, omitColumns: params.omitColumns ?? [], url })
		]);

		const columns = applyColumnsOrder(columnsUnsorted, settings.columnsOrder ?? []);

		if (
			columns.length &&
			!columns.some((c: any) => (typeof c === 'string' ? c : c.key) === settings.sortKey)
		) {
			const firstKey = typeof columns[0] === 'string' ? columns[0] : columns[0].key;
			settings.sortKey = firstKey ?? '';
		}

		const mongoFilter = filtersToMongoQuery(settings.filter ?? {});

		const rows =
			'query' in params
				? getRows({
						labelFunctionMap: params.labelFunctionMap,
						query: params.query,
						settings: { mongoFilter, ...settings }
					})
				: getRows({
						labelFunctionMap: params.labelFunctionMap,
						model: params.model,
						settings: {
							_routeId: settings._routeId,
							columnsOrder: settings.columnsOrder,
							currentPage: settings.currentPage,
							mongoFilter,
							rowsPerPage: settings.rowsPerPage,
							sortDirection: settings.sortDirection,
							sortKey: settings.sortKey
						}
					});

		const totalRows = params.model.countDocuments(mongoFilter);

		return { columns, rows, settings, totalRows };
	};
};
