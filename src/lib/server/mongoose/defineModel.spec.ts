import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { defineModel } from './defineModel';
import { hooks } from './hooks';

const environment = vi.hoisted(() => ({ dev: true }));
vi.mock('$app/environment', () => environment);
beforeEach(() => {
	environment.dev = true;
});
afterEach(() => {
	mongoose.deleteModel(/^HmrModelTest/);
	vi.restoreAllMocks();
});

describe('Mongoose model registration during server reloads', () => {
	it('recompiles changed schemas in development and updates both model registries', () => {
		const first = defineModel('HmrModelTestPaths', { oldField: String }, { log: false });
		const second = defineModel(
			'HmrModelTestPaths',
			{ newField: { type: String, required: true } },
			{ log: false }
		);
		expect(second).not.toBe(first);
		expect(second.schema.path('newField')).toBeDefined();
		expect(second.schema.path('oldField')).toBeUndefined();
		expect(first.schema.path('oldField')).toBeDefined();
		expect(mongoose.model('HmrModelTestPaths')).toBe(second);
		expect(mongoose.connection.model('HmrModelTestPaths')).toBe(second);
		expect(second.collection.name).toBe(first.collection.name);
		expect(second.schema.path('createdAt')).toBeDefined();
		expect(second.schema.path('_createdById')).toBeDefined();
	});
	it('applies fresh middleware and virtuals once per compiled schema', async () => {
		const oldHook = vi.fn();
		const newHook = vi.fn();
		const log = vi.spyOn(hooks.log, 'all');
		defineModel(
			'HmrModelTestHooks',
			{ title: String },
			{
				customHooks: [
					(schema) => {
						schema.pre('validate', function (next) {
							oldHook();
							next();
						});
						schema.virtual('caption').get(() => 'old');
					}
				]
			}
		);
		const latest = defineModel(
			'HmrModelTestHooks',
			{ title: String },
			{
				customHooks: [
					(schema) => {
						schema.pre('validate', function (next) {
							newHook();
							next();
						});
						schema.virtual('caption').get(() => 'new');
					}
				]
			}
		);
		const document = new latest({ title: 'Updated' });
		await document.validate();
		expect(document.get('caption')).toBe('new');
		expect(newHook).toHaveBeenCalledOnce();
		expect(oldHook).not.toHaveBeenCalled();
		expect(log).toHaveBeenCalledTimes(2);
		defineModel('HmrModelTestNoLog', {}, { log: false });
		expect(log).toHaveBeenCalledTimes(2);
	});
	it('continues rejecting conflicting registrations in production', () => {
		environment.dev = false;
		const first = defineModel('HmrModelTestProduction', { title: String }, { log: false });
		expect(() =>
			defineModel('HmrModelTestProduction', { changed: String }, { log: false })
		).toThrow(mongoose.Error.OverwriteModelError);
		expect(mongoose.model('HmrModelTestProduction')).toBe(first);
	});
});
