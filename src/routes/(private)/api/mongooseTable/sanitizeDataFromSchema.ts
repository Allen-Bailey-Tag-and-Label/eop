import { type Model, Types } from 'mongoose';

export const sanitizeDataFromSchema = <T extends Record<string, any>>(
	model: Model<any>,
	data: T
): T => {
	const sanitizedData = {} as T;
	const schemaPaths = model.schema.paths;

	for (const key in data) {
		const path = schemaPaths[key];
		if (!path) continue; // Skip if key not in schema

		let value = data[key];
		const instance = path.instance?.toLowerCase();

		// Skip empty string for ObjectId fields
		if (instance === 'objectid' && value === '') continue;

		// Convert string to ObjectId if applicable
		if (instance === 'objectid' && typeof value === 'string') {
			try {
				value = new Types.ObjectId(value);
			} catch {
				continue;
			}
		}

		// Coerce numbers
		if (instance === 'number') {
			const num = Number(value);
			if (!Number.isNaN(num)) value = num;
			else continue;
		}

		// Coerce booleans
		if (instance === 'boolean') {
			if (value === 'true' || value === true) value = true;
			else if (value === 'false' || value === false) value = false;
			else continue;
		}

		// Optional: strip empty strings for other types
		if (value === '') continue;

		sanitizedData[key] = value;
	}

	return sanitizedData;
};
