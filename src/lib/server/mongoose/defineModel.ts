import { Schema, model, Types, type SchemaDefinition, type SchemaOptions } from 'mongoose';
import { hooks } from './hooks';

type HookOption<T> = {
	customHooks?: ((schema: Schema<T>) => void)[];
	log?: boolean;
};

const _createdById = { type: Types.ObjectId, ref: 'User', required: false };

const schemaOptions = {
	timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
};

export const defineModel = <T>(name: string, schemaDef: any, hookOptions?: HookOption<T>) => {
	const schema = new Schema<T>(
		{
			_createdById,
			...schemaDef
		},
		schemaOptions
	);

	if (hookOptions?.log !== false) {
		hooks.log.all(schema, name);
	}

	hookOptions?.customHooks?.forEach((fn) => fn(schema));

	return model<T>(name, schema);
};
