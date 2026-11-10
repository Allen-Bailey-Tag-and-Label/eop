import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShippingMarkup } from '../mongoose/models/ShippingMarkup';
import { getMarkupConfigs, manageMarkup } from './markups';
import type { MarkupConfig } from '$lib/shipping/types';
vi.mock('../mongoose/models/ShippingMarkup', () => ({
	ShippingMarkup: { find: vi.fn(), updateOne: vi.fn(), init: vi.fn(async () => {}) }
}));
let configs: MarkupConfig[];
beforeEach(() => {
	vi.clearAllMocks();
	configs = [];
	vi.mocked(ShippingMarkup.find).mockImplementation(
		() => ({ select: () => ({ lean: async () => structuredClone(configs) }) }) as never
	);
	const updateOne = ShippingMarkup.updateOne as unknown as ReturnType<typeof vi.fn>;
	updateOne.mockImplementation(async (filter: unknown, update: unknown) => {
		const expected = filter as { service: string; revision: number };
		const row = configs.find((config) => config.service === expected.service);
		if (row && row.revision !== expected.revision)
			return { matchedCount: 0, upsertedCount: 0 } as never;
		const next = {
			service: expected.service,
			revision: expected.revision + 1,
			ranges: (update as { $set: { ranges: MarkupConfig['ranges'] } }).$set.ranges
		} as MarkupConfig;
		if (row) Object.assign(row, next);
		else configs.push(next);
		return { matchedCount: row ? 1 : 0, upsertedCount: row ? 0 : 1 } as never;
	});
});
function fields(
	minimum = '0',
	maximum = '100',
	percent = '10',
	service = 'UPS',
	revision = '0',
	id = crypto.randomUUID()
) {
	const result = new FormData();
	for (const [key, value] of Object.entries({
		minimum,
		maximum,
		percent,
		service,
		revision,
		id,
		label: 'Standard'
	}))
		result.set(key, value);
	return result;
}
describe('persisted shipping markups', () => {
	it('returns 0% defaults without inserting made-up ranges', async () => {
		expect(await getMarkupConfigs()).toEqual([
			{ service: 'UPS', revision: 0, ranges: [] },
			{ service: 'LTL', revision: 0, ranges: [] }
		]);
		expect(ShippingMarkup.updateOne).not.toHaveBeenCalled();
	});
	it('creates separate service configurations and rejects overlap within a service', async () => {
		await manageMarkup(fields(), 'user', 'save');
		await manageMarkup(fields('0', '100', '20', 'LTL'), 'user', 'save');
		await expect(
			manageMarkup(fields('50', '150', '10', 'UPS', '1'), 'user', 'save')
		).rejects.toThrow('overlap');
		expect(configs).toHaveLength(2);
		expect(configs[0].ranges[0].percentBps).toBe(1000);
		expect(configs[1].ranges[0].percentBps).toBe(2000);
	});
	it('edits and deletes exact rule IDs using revisions without changing other ranges', async () => {
		const original = fields();
		await manageMarkup(original, 'user', 'save');
		original.set('revision', '1');
		original.set('percent', '25');
		original.set('editing', 'true');
		await manageMarkup(original, 'user', 'save');
		expect(configs[0]).toMatchObject({ revision: 2, ranges: [{ percentBps: 2500 }] });
		await expect(manageMarkup(original, 'user', 'save')).rejects.toThrow('Another editor');
		original.set('revision', '2');
		await manageMarkup(original, 'user', 'delete');
		expect(configs[0].ranges).toEqual([]);
	});
	it('prevents competing writes from installing overlapping ranges', async () => {
		await manageMarkup(fields(), 'user', 'save');
		const results = await Promise.allSettled([
			manageMarkup(fields('100', '200', '10', 'UPS', '1'), 'user', 'save'),
			manageMarkup(fields('150', '250', '10', 'UPS', '1'), 'user', 'save')
		]);
		expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		expect(configs[0].ranges).toHaveLength(2);
	});
});
