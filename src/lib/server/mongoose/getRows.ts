import {
	buildRefLabelExprBuilder,
	connect,
	getSchemaPath,
	isRefPath,
	type LabelFunctionMap,
	type Model,
	type Query,
	type Settings,
	type Sort
} from './';

type ModelParams<T> = {
	labelFunctionMap?: LabelFunctionMap;
	model: Model<T>;
	settings: Omit<Settings, 'filter'> & { mongoFilter: Record<string, any> };
};
type QueryParams<T> = {
	labelFunctionMap?: LabelFunctionMap;
	query: () => Query<T[], T>;
	settings: Omit<Settings, 'filter'> & { mongoFilter: Record<string, any> };
};
type Params<T> = ModelParams<T> | QueryParams<T>;

export const getRows = async <T>(params: Params<T>): Promise<T[]> => {
	await connect();

	const { currentPage, mongoFilter, rowsPerPage, sortDirection, sortKey } = params.settings;
	const skip = currentPage * rowsPerPage;
	const dir: 1 | -1 = sortDirection === 'asc' ? 1 : -1;

	let rows: any[] = [];

	// Only the `model` branch supports aggregation sorting by label
	if ('model' in params && sortKey) {
		const baseModel = params.model;
		const p: any = getSchemaPath(baseModel, sortKey);

		if (p && isRefPath(p)) {
			const refModelName: string = p.options.ref; // e.g. 'Route'
			const refModel = baseModel.db.model(refModelName);
			const labelFn = params.labelFunctionMap?.get(refModelName); // e.g. (doc)=>...

			const labelExprBuilder = buildRefLabelExprBuilder(refModel, labelFn);
			const as = `__${sortKey}_pop`;

			const pipeline: any[] = [
				{ $match: mongoFilter },
				{
					$lookup: {
						from: refModel.collection.name,
						localField: sortKey,
						foreignField: '_id',
						as
					}
				},
				{ $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true } },
				{ $addFields: { __sortKey: labelExprBuilder(as) } },
				{ $sort: { __sortKey: dir } },
				{ $project: { __sortKey: 0, [as]: 0 } },
				{ $skip: skip },
				{ $limit: rowsPerPage }
			];

			rows = await baseModel.aggregate(pipeline).exec();
		} else {
			// Fallback: original path (no label-aware sorting)
			const sort: Sort = sortKey ? { [sortKey]: dir } : {};
			const query = params.model.find(mongoFilter).sort(sort).skip(skip).limit(rowsPerPage);

			rows = await query.lean().exec();
		}
	} else {
		// Fallback: original path (no label-aware sorting)
		const sort: Sort = sortKey ? { [sortKey]: dir } : {};
		let query: Query<T[], T>;
		if ('query' in params) {
			query = params.query().find(mongoFilter).sort(sort).skip(skip).limit(rowsPerPage);
		} else {
			query = params.model.find(mongoFilter).sort(sort).skip(skip).limit(rowsPerPage);
		}

		rows = await query.lean().exec();
	}
	return JSON.parse(JSON.stringify(rows));
};
