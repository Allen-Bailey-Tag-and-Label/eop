import type { Schema } from 'mongoose';
import { hooks } from './hooks';

/**
 * Attach hooks based on model name and custom config
 */
export const attachHooks = <T>(
	schema: Schema<T>,
	modelName: string,
	options?: {
		log?: boolean;
		customHooks?: ((schema: Schema<T>) => void)[];
	}
): Schema<T> => {
	if (options?.log !== false) {
		hooks.log.all(schema, modelName);
	}

	options?.customHooks?.forEach((fn) => fn(schema));

	return schema;
};
