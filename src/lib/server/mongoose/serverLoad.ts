import type { ServerLoadEvent } from '@sveltejs/kit';
import {
	connect,
	getColumns,
	getRows,
	getSettings,
	type Filter,
	type LabelFunctionMap,
	type Model,
	type Query
} from './';

type ModelParams<T> = {
	filter?: Filter;
	labelFunctionMap?: LabelFunctionMap;
	model: Model<T>;
};
type Params<T> = ModelParams<T> | QueryParams<T>;
type QueryParams<T> = {
	filter?: Filter;
	labelFunctionMap?: LabelFunctionMap;
	model: Model<T>;
	query: () => Query<T[], T>;
};

export const serverLoad = <T>(params: Params<T>) => {
	return async ({ locals, url }: ServerLoadEvent) => {
		await connect();

		const [columns, settings] = await Promise.all([
			params.model
				? getColumns({ labelFunctionMap: params.labelFunctionMap, model: params.model })
				: [],
			getSettings({ locals, url })
		]);

		const rows =
			'query' in params
				? getRows({ query: params.query, settings })
				: getRows({ model: params.model, filter: params.filter ?? {}, settings });

		const totalRows = params.model.countDocuments(params.filter ?? {});

		return { columns, rows, settings, totalRows };
	};
};
