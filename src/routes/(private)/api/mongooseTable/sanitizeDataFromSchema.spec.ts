import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose, { Schema } from 'mongoose';
import { sanitizeDataFromSchema } from './sanitizeDataFromSchema';

const environment = vi.hoisted(() => ({ dev: true }));
vi.mock('$app/environment', () => environment);
const connection = mongoose.createConnection();
beforeEach(() => {
	environment.dev = true;
});
afterEach(() => {
	connection.deleteModel(/.+/);
});

describe('nested schema model cache', () => {
	it('refreshes document-array and single-nested schemas after parent recompilation', () => {
		const first = connection.model(
			'HmrNestedParent',
			new Schema({
				items: [new Schema({ oldField: String })],
				detail: new Schema({ oldField: String })
			})
		);
		sanitizeDataFromSchema(first, {
			items: [{ oldField: 'first' }],
			detail: { oldField: 'first' }
		});
		const previousArray = connection.models.HmrNestedParent_items;
		const previousDetail = connection.models.HmrNestedParent_detail;
		connection.deleteModel('HmrNestedParent');
		const latest = connection.model(
			'HmrNestedParent',
			new Schema({
				items: [new Schema({ added: Boolean })],
				detail: new Schema({ added: Boolean })
			})
		);
		const result = sanitizeDataFromSchema(latest, {
			items: [{ added: 'true', oldField: 'discard' }],
			detail: { added: 'false', oldField: 'discard' }
		});
		expect(result).toEqual({ items: [{ added: true }], detail: { added: false } });
		expect(connection.models.HmrNestedParent_items).not.toBe(previousArray);
		expect(connection.models.HmrNestedParent_detail).not.toBe(previousDetail);
		const cached = connection.models.HmrNestedParent_items;
		sanitizeDataFromSchema(latest, { items: [{ added: 'true' }] });
		expect(connection.models.HmrNestedParent_items).toBe(cached);
	});
	it('preserves production caching for a reused nested schema', () => {
		environment.dev = false;
		const parent = connection.model(
			'HmrNestedParent',
			new Schema({ items: [new Schema({ enabled: Boolean })] })
		);
		sanitizeDataFromSchema(parent, { items: [{ enabled: 'true' }] });
		const cached = connection.models.HmrNestedParent_items;
		sanitizeDataFromSchema(parent, { items: [{ enabled: 'false' }] });
		expect(connection.models.HmrNestedParent_items).toBe(cached);
	});
});
