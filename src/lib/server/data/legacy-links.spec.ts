import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSource } from './models';
import { extractLegacyLinks } from './legacy-links';
import { blankSlide, defaultDataSource, newElement } from '$lib/slides/types';
import { defaultRepeater } from '$lib/slides/repeater';
import { validateSlide } from '$lib/slides/validation';
import { validateWorkflow, executeWorkflow } from '$lib/data/workflows';
vi.mock('./models', () => ({ DataSource: { updateOne: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());

describe('legacy slide data compatibility', () => {
	it('extracts nested inline queries idempotently without modifying the original published definition', async () => {
		const list = {
			...newElement('list', 'holidays'),
			dataSource: {
				...defaultDataSource(),
				model: 'Holiday',
				select: 'name date',
				labelField: 'name',
				detailField: 'date',
				detailFormat: 'date' as const,
				timeZone: 'UTC',
				emptyMessage: 'No upcoming holidays'
			},
			repeater: { ...defaultRepeater(), staggerMs: 200 }
		};
		list.keyframes = [
			{ x: list.x, y: list.y, scale: 1, rotation: 0, atMs: 0, easing: 'linear', opacity: 0 }
		];
		const frame = {
			...newElement('frame', 'group'),
			frame: {
				layout: 'free' as const,
				columns: 2,
				columnGap: 10,
				rowGap: 10,
				justify: 'start' as const,
				align: 'start' as const,
				wrap: false,
				clip: false,
				elements: [list]
			}
		};
		const original = { ...blankSlide(), elements: [frame] };
		const before = structuredClone(original);
		const first = await extractLegacyLinks(original, 'a'.repeat(24));
		const second = await extractLegacyLinks(original, 'a'.repeat(24));
		expect(original).toEqual(before);
		expect(first).toEqual(second);
		const converted = validateSlide(first).elements[0].frame!.elements[0];
		expect(converted.dataSource).toBeUndefined();
		expect(converted.type).toBe('repeater');
		expect(converted.repeatItems).toMatchObject({ mode: 'source', source: { output: 'rows' } });
		expect(converted.keyframes).toEqual(list.keyframes);
		expect(converted.repeater?.staggerMs).toBe(200);
		expect(converted.dataTimeZone).toBe('UTC');
		expect(converted.dataEmptyMessage).toBe('No upcoming holidays');
		expect(converted.repeater?.template.elements[1].bindings?.text).toEqual(
			list.repeater.template.elements[1].binding
		);
		const call = (vi.mocked(DataSource.updateOne).mock.calls as unknown[][])[0];
		expect(call[1]).toHaveProperty('$setOnInsert');
		expect(call[1]).not.toHaveProperty('$set');
		const workflow = (call[1] as { $setOnInsert: { published: unknown } }).$setOnInsert.published;
		const result = await executeWorkflow(
			validateWorkflow(workflow),
			{},
			{
				database: async () => [
					{
						_id: 'one',
						name: 'Holiday',
						date: '2026-12-25',
						_label: 'Holiday',
						_detail: 'Dec 25, 2026'
					}
				],
				api: vi.fn()
			}
		);
		expect(result.outputs.rows[0]).toMatchObject({
			_label: 'Holiday',
			_detail: 'Dec 25, 2026',
			name: 'Holiday'
		});
		await extractLegacyLinks(first, 'a'.repeat(24));
		expect(DataSource.updateOne).toHaveBeenCalledTimes(2);
	});
	it('preserves named sources and old independent template overrides without creating another link', async () => {
		const reference = { sourceId: 'b'.repeat(24), output: 'employees', parameters: {} };
		const repeater = {
			...newElement('list', 'cards'),
			dataReference: reference,
			dataSource: { ...defaultDataSource(), timeZone: 'UTC' },
			repeater: defaultRepeater()
		};
		repeater.repeater.template.elements[1].dataReference = {
			...reference,
			sourceId: 'c'.repeat(24)
		};
		const result = await extractLegacyLinks(
			{ ...blankSlide(), elements: [repeater] },
			'a'.repeat(24)
		);
		expect(result.elements[0].repeatItems).toEqual({ mode: 'source', source: reference });
		expect(result.elements[0].dataReference).toBeUndefined();
		expect(result.elements[0].dataSource).toBeUndefined();
		expect(result.elements[0].dataTimeZone).toBe('UTC');
		expect(result.elements[0].repeater?.template.elements[1].dataReference?.sourceId).toBe(
			'c'.repeat(24)
		);
		expect(DataSource.updateOne).not.toHaveBeenCalled();
	});
	it('converts plain legacy data lists while retaining their label/detail presentation', async () => {
		const list = {
			...newElement('list', 'list'),
			dataSource: { ...defaultDataSource(), model: 'Holiday', select: 'name', labelField: 'name' }
		};
		const converted = await extractLegacyLinks(
			{ ...blankSlide(), elements: [list] },
			'a'.repeat(24)
		);
		expect(validateSlide(converted).elements[0]).toMatchObject({
			type: 'list',
			dataReference: { output: 'rows' }
		});
		expect(converted.elements[0].dataSource).toBeUndefined();
	});
});
