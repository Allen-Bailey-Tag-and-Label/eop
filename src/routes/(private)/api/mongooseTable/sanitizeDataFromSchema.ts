import { Types, type Model } from 'mongoose';

export const sanitizeDataFromSchema = <T extends Record<string, any>>(
	model: Model<any>,
	data: T
): T => {
	const sanitized: Record<string, any> = {};
	const schemaPaths = model.schema.paths;

	for (const key in schemaPaths) {
		const path = schemaPaths[key];
		const rawValue = data[key];

		if (rawValue === undefined) continue;

		const isRequired = path.options?.required === true;

		// Handle empty strings for optional fields
		if (typeof rawValue === 'string' && rawValue === '' && !isRequired) continue;

		// Handle ObjectId
		if (path.instance === 'ObjectID') {
			if (Types.ObjectId.isValid(rawValue)) {
				sanitized[key] = new Types.ObjectId(rawValue);
			}
			continue;
		}

		// Handle arrays
		if (path.instance === 'Array') {
			const caster = path.caster;

			// Array of ObjectIds
			if (caster?.instance === 'ObjectID') {
				const arrayValues = Array.isArray(rawValue) ? rawValue : [rawValue];
				sanitized[key] = arrayValues
					.filter((id) => Types.ObjectId.isValid(id))
					.map((id) => new Types.ObjectId(id));
				continue;
			}

			// Array of subdocuments
			if (caster?.schema) {
				const subModel = model.db.model(`${model.modelName}_${key}`, caster.schema);
				sanitized[key] = Array.isArray(rawValue)
					? rawValue.map((item) => sanitizeDataFromSchema(subModel, item))
					: [];
				continue;
			}
		}

		// Handle nested schema / subdocument
		if (path.schema) {
			const subModel = model.db.model(`${model.modelName}_${key}`, path.schema);
			sanitized[key] = sanitizeDataFromSchema(subModel, rawValue);
			continue;
		}

		// Handle Mixed or other generic types
		sanitized[key] = rawValue;
	}

	return sanitized as T;
};
