import { Schema, model, Types } from 'mongoose';
import { dev } from '$app/environment';
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

	// Vite reloads server modules while Mongoose retains its process-wide registry.
	// Recompile in development so updated paths, hooks, and virtuals take effect.
	// Keeping the production guard catches accidental duplicate registrations.
	return model<T>(name, schema, undefined, { overwriteModels: dev });
};
