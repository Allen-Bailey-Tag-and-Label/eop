import type { Schema } from 'mongoose';
import { User, UserProfile, UserSettings } from './models';
import { logOperation, shouldSkipLogging } from './middleware';

const enableVirtuals = (schema: Schema) => {
	if (schemasWithVirtuals.has(schema)) return;
	schema.set('toObject', { virtuals: true });
	schema.set('toJSON', { virtuals: true });
	schemasWithVirtuals.add(schema);
};

const schemasWithVirtuals = new WeakSet<Schema>();

export class Hooks {
	branch = {
		_branchIds(schema: Schema) {
			schema.virtual('_branchIds', {
				ref: 'User',
				localField: '_id',
				foreignField: '_branchIds',
				justOne: false
			});
			enableVirtuals(schema);
		},
		_defaultBranchId(schema: Schema) {
			schema.virtual('_defaultBranchId', {
				ref: 'User',
				localField: '_id',
				foreignField: '_defaultBranchId',
				justOne: false
			});
			enableVirtuals(schema);
		}
	};
	log = {
		all(schema: Schema, modelName: string) {
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
		}
	};
	user = {
		save(schema: Schema) {
			schema.post('save', async function (doc, next) {
				try {
					if (shouldSkipLogging()) return next?.();
					if ((doc as any)._profileId && (doc as any)._settingsId) return next?.();

					const [profile, settings] = await Promise.all([
						UserProfile.create({ _createdById: doc._id }),
						UserSettings.create({ _createdById: doc._id })
					]);

					await User.findByIdAndUpdate(doc._id, {
						_profileId: profile._id,
						_settingsId: settings._id
					});
				} catch (err) {
					console.error('[User post-save hook]', err);
				}
				next?.();
			});
		}
	};
	userProfile = {
		_userId(schema: Schema) {
			schema.virtual('_userId', {
				ref: 'User',
				localField: '_id',
				foreignField: '_profileId',
				justOne: true
			});
			enableVirtuals(schema);
		},
		fullName(schema: Schema) {
			schema.virtual('fullName').get(function () {
				return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
			});
			enableVirtuals(schema);
		}
	};
	userSettings = {
		_userId(schema: Schema) {
			schema.virtual('_userId', {
				ref: 'User',
				localField: '_id',
				foreignField: '_settingsId',
				justOne: true
			});
			enableVirtuals(schema);
		}
	};
}

export const hooks = new Hooks();
