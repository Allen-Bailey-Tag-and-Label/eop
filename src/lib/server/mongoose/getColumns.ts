import { type Column, type LabelFunctionMap, type Model } from './';

const systemFields = new Set(['_id', '_createdById', 'createdAt', 'updatedAt']);
const defaultLabelPriority = ['label', 'name', 'title', 'username'];

type GetColumnsOptions = {
	model: Model<any>;
	labelFunctionMap?: LabelFunctionMap; // ref name -> label function
};

/** Load reference documents and return { label, value }[] options */
const getOptionsFromRefModel = async (
	refModel: Model<any>,
	labelFn?: (doc: any) => any
): Promise<{ label: string; value: string }[]> => {
	const docs = await refModel.find().lean();
	return docs.map((doc: any) => {
		let label: string;

		if (labelFn) {
			label = labelFn(doc);
		} else {
			const fallbackKey = defaultLabelPriority.find((key) => typeof doc[key] === 'string');
			label = fallbackKey ? doc[fallbackKey] : doc._id.toString();
		}

		return {
			label,
			value: doc._id.toString()
		};
	});
};

export const getColumns = async ({
	model,
	labelFunctionMap = new Map()
}: GetColumnsOptions): Promise<Column[]> => {
	const schemaPaths = model.schema.paths;
	const columns: Column[] = [];

	for (const [key, schemaType] of Object.entries(schemaPaths)) {
		if (key.startsWith('__')) continue;

		const column: Column = { key, type: 'string' };

		// Detect ref (relation field)
		const ref = (schemaType as any)?.options?.ref;
		if (ref) {
			column.type = 'ref';

			const labelFn = labelFunctionMap.get(ref);
			const refModel = model.db.model(ref);
			column.options = await getOptionsFromRefModel(refModel, labelFn);
		} else {
			const typeName = schemaType.instance;
			if (typeName === 'Boolean') column.type = 'boolean';
			else if (typeName === 'Number') column.type = 'number';
			else if (typeName === 'Date') column.type = 'timestamp';
			else if (typeName === 'ObjectID') column.type = 'string';
		}

		if (systemFields.has(key)) {
			column.isCreatable = false;
			column.isEditable = false;
		}

		columns.push(column);
	}

	return JSON.parse(JSON.stringify(columns));
};
