// sanitizeDataFromSchema.ts
import mongoose, { Types, type Model, type Schema } from 'mongoose';

const normalizeBoolean = (v: any) => {
	if (v === true || v === 'true' || v === 'on' || v === 1 || v === '1') return true;
	if (v === false || v === 'false' || v === 0 || v === '0' || v == null) return false;
	// fallback (e.g., non-empty strings become true)
	return Boolean(v);
};

const getOrCreateSubModel = (model: Model<any>, name: string, schema: Schema) => {
	// Use the same connection to avoid model name clashes across connections
	const conn = model.db;
	return conn.models[name] ?? conn.model(name, schema);
};

export const sanitizeDataFromSchema = <T extends Record<string, any>>(
	model: Model<any>,
	data: T
): T => {
	const sanitized: Record<string, any> = {};
	const schemaPaths = model.schema.paths as Record<string, any>; // runtime guard access

	for (const key in schemaPaths) {
		const path = schemaPaths[key];
		const rawValue = (data as any)[key];

		if (rawValue === undefined) continue;

		const isRequired = path.options?.required === true;

		// Skip empty strings for optional fields
		if (typeof rawValue === 'string' && rawValue === '' && !isRequired) continue;

		// ObjectId
		if (path.instance === 'ObjectID') {
			if (Types.ObjectId.isValid(rawValue)) {
				sanitized[key] = new Types.ObjectId(rawValue);
			}
			continue;
		}

		// Boolean (handle "on" and other truthy/falsy strings/numbers)
		if (path.instance === 'Boolean') {
			sanitized[key] = normalizeBoolean(rawValue);
			continue;
		}

		// Arrays (use Mongoose runtime flags to narrow)
		if ((path as any).$isMongooseArray) {
			// DocumentArray (array of subdocuments)
			if ((path as any).$isMongooseDocumentArray) {
				const subSchema: Schema = (path as any).schema;
				const SubModel = getOrCreateSubModel(model, `${model.modelName}_${key}`, subSchema);
				const arr = Array.isArray(rawValue) ? rawValue : rawValue == null ? [] : [rawValue];
				sanitized[key] = arr.map((item) => sanitizeDataFromSchema(SubModel, item));
				continue;
			}

			// Regular array with a caster (e.g., ObjectId[], String[], Number[], Boolean[]…)
			const caster = (path as any).caster;
			// Array of ObjectIds
			if (caster?.instance === 'ObjectID') {
				const arr = Array.isArray(rawValue) ? rawValue : [rawValue];
				sanitized[key] = arr
					.filter((id) => Types.ObjectId.isValid(id))
					.map((id) => new Types.ObjectId(id));
				continue;
			}
			// Array of booleans
			if (caster?.instance === 'Boolean') {
				const arr = Array.isArray(rawValue) ? rawValue : rawValue == null ? [] : [rawValue];
				sanitized[key] = arr.map(normalizeBoolean);
				continue;
			}
			// Default: pass through (optionally, you could coerce numbers/strings here)
			sanitized[key] = Array.isArray(rawValue) ? rawValue : rawValue == null ? [] : [rawValue];
			continue;
		}

		// Single nested (subdocument) — e.g., { foo: { ... } } with its own schema
		if ((path as any).$isSingleNested && (path as any).schema) {
			const subSchema: Schema = (path as any).schema;
			const SubModel = getOrCreateSubModel(model, `${model.modelName}_${key}`, subSchema);
			sanitized[key] = sanitizeDataFromSchema(SubModel, rawValue ?? {});
			continue;
		}

		// Mixed / everything else
		sanitized[key] = rawValue;
	}

	return sanitized as T;
};
