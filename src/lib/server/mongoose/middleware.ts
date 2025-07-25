import { type Schema, Types } from 'mongoose';
import { Log } from './models';

let skipLogging = false;

export const attachLogging = <T>(schema: Schema<T>, modelName: string) => {
	schema.post('save', function (doc) {
		logOperation({
			_createdById: (doc as any)._createdById,
			data: doc,
			model: modelName,
			operation: 'create'
		});
	});

	schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
		const _createdById = this.getOptions()._createdById;
		if (_createdById) {
			(this as any)._createdById = _createdById;
		}
		next();
	});

	schema.post(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
		const _createdById = (this as any)._createdById;
		logOperation({
			_createdById,
			data: { query: this.getQuery(), update: this.getUpdate() },
			model: modelName,
			operation: 'update'
		});
	});

	schema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], function (next) {
		const _createdById = this.getOptions()._createdById;
		if (_createdById) {
			(this as any)._createdById = _createdById;
		}
		next();
	});

	schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], function () {
		const _createdById = (this as any)._createdById;
		logOperation({
			_createdById,
			data: this.getQuery(),
			model: modelName,
			operation: 'delete'
		});
	});
};

export const logOperation = async (params: {
	_createdById?: Types.ObjectId;
	data: unknown;
	model: string;
	operation: string;
}) => {
	if (skipLogging) return;
	try {
		await Log.create(params);
	} catch (err) {
		console.error('[Log Error]', err); // Avoid crashing on log failure
	}
};

export const setSkipLogging = (value: boolean) => {
	skipLogging = value;
};
