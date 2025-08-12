// getColumns.ts
import { type Column, type LabelFunctionMap, type Model } from './';

const systemFields = new Set(['_id', '_createdById', 'createdAt', 'updatedAt']);
const defaultLabelPriority = ['label', 'name', 'title', 'username'];

type GetColumnsOptions = {
	labelFunctionMap?: LabelFunctionMap;
	model: Model<any>;
	omitColumns: string[];
};

/** Local union (keep independent from your Column['type'] shape) */
type ColumnType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'timestamp'
	| 'select' // single-select (refs, enums)
	| 'multiSelect'; // multi-select (array-of-refs, array-of-enums)

/** Build {label,value}[] from a ref model */
const getOptionsFromRefModel = async (
	refModel: Model<any>,
	labelFn?: (doc: any) => string
): Promise<{ label: string; value: string }[]> => {
	const docs = await refModel.find().lean();
	return docs
		.map((doc: any) => {
			const fallbackKey = defaultLabelPriority.find((k) => typeof doc[k] === 'string');
			const label = labelFn ? labelFn(doc) : fallbackKey ? doc[fallbackKey] : String(doc._id);
			return { label, value: String(doc._id) };
		})
		.sort((a, b) => a.label.localeCompare(b.label));
};

/** Build {label,value}[] from a Mongoose enum */
const getOptionsFromEnum = (values: any[]): { label: string; value: string }[] =>
	values.map((v) => ({ label: String(v), value: String(v) }));

/** Extract ref info, including array-of-refs (caster/$embeddedSchemaType) */
function getRefInfo(schemaType: any): { ref?: string; isArray: boolean } {
	const directRef = schemaType?.options?.ref as string | undefined;
	const caster = schemaType?.caster ?? schemaType?.$embeddedSchemaType;
	const casterRef = caster?.options?.ref as string | undefined;

	if (directRef) return { ref: directRef, isArray: false };
	if (casterRef) return { ref: casterRef, isArray: true };
	return { isArray: schemaType?.instance === 'Array' };
}

/** Normalize primitive instance → ColumnType (non-select cases) */
function resolvePrimitiveType(instance?: string): Exclude<ColumnType, 'select' | 'multiSelect'> {
	if (instance === 'Boolean') return 'boolean';
	if (instance === 'Number') return 'number';
	if (instance === 'Date') return 'timestamp';
	// ObjectID without ref → treat as string
	return 'string';
}

export const getColumns = async ({
	labelFunctionMap = new Map(),
	model,
	omitColumns
}: GetColumnsOptions): Promise<Column[]> => {
	const schemaPaths = model.schema.paths;
	const columns: Column[] = [];

	for (const [key, schemaType] of Object.entries(schemaPaths)) {
		if (key.startsWith('__')) continue;
		if (omitColumns.includes(key)) continue;

		// Build as `any` so we can add fields freely, then return as Column[]
		const column: any = { key, type: 'string' as ColumnType };

		// 1) Refs → select / multiSelect with loaded options
		const { ref, isArray } = getRefInfo(schemaType as any);
		if (ref) {
			column.type = (isArray ? 'multiSelect' : 'select') as ColumnType;

			const labelFn = labelFunctionMap.get(ref);
			const refModel = model.db.model(ref);
			column.options = await getOptionsFromRefModel(refModel, labelFn);

			if (systemFields.has(key)) {
				column.isCreatable = false;
				column.isEditable = false;
			}

			columns.push(column);
			continue;
		}

		// 2) Enums (including array-of-enums) → select / multiSelect
		const instance = (schemaType as any).instance; // 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectID' | 'Array'
		const enumValues = (schemaType as any)?.options?.enum as any[] | undefined;

		if (instance === 'Array') {
			const caster = (schemaType as any).caster ?? (schemaType as any).$embeddedSchemaType;
			const casterEnum = caster?.options?.enum as any[] | undefined;

			if (casterEnum?.length) {
				column.type = 'multiSelect';
				column.options = getOptionsFromEnum(casterEnum);
			} else {
				// array of primitives without enum → keep primitive; UI can decide rendering
				column.type = resolvePrimitiveType(caster?.instance);
			}
		} else if (enumValues?.length) {
			column.type = 'select';
			column.options = getOptionsFromEnum(enumValues);
		} else {
			// 3) Plain primitives
			column.type = resolvePrimitiveType(instance);
		}

		if (systemFields.has(key)) {
			column.isCreatable = false;
			column.isEditable = false;
		}

		columns.push(column);
	}

	// sanitize
	return JSON.parse(JSON.stringify(columns));
};
