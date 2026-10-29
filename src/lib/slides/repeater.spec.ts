import { describe, expect, it } from 'vitest';
import {
	boundText,
	defaultRepeater,
	gridLayout,
	templateSlide,
	repeaterItemTime
} from './repeater';
import { blankSlide, defaultDataSource, newElement } from './types';
import { validateSlide } from './validation';
import { mediaIds } from './media';

describe('grid repeaters', () => {
	it('staggered item clocks restart per page and remain stable across scroll virtualization', () => {
		const settings = { ...defaultRepeater(), staggerMs: 200 };
		expect(repeaterItemTime(settings, 100, 1, 0)).toBe(-100);
		expect(repeaterItemTime(settings, 5500, 1, 4)).toBe(300);
		expect(repeaterItemTime(settings, 10000, 1, 0)).toBe(-200);
		settings.overflow = 'scroll';
		expect(repeaterItemTime(settings, 1500, 5, 0)).toBe(500);
		expect(repeaterItemTime(settings, 1500, 1, 4)).toBe(500);
		settings.staggerMs = 0;
		expect(repeaterItemTime(settings, 5500, 1, 4)).toBe(5500);
	});
	it('paginates at deterministic times without shrinking items', () => {
		const settings = defaultRepeater();
		const first = gridLayout(settings, 1000, 400, 7, 0);
		expect(first).toMatchObject({
			columns: 2,
			itemWidth: 490,
			itemHeight: 180,
			capacity: 4,
			pages: 2,
			page: 0,
			start: 0,
			visibleCount: 4
		});
		expect(gridLayout(settings, 1000, 400, 7, 5000)).toMatchObject({
			page: 1,
			start: 4,
			visibleCount: 3
		});
		expect(gridLayout(settings, 1000, 400, 7, 10000).page).toBe(0);
	});
	it('fits automatic columns and optional template aspect height to available space', () => {
		const settings = { ...defaultRepeater(), columns: 0, minItemWidth: 300, itemHeight: 0 };
		expect(gridLayout(settings, 1000, 500, 10, 0).columns).toBe(3);
		const narrow = gridLayout(settings, 650, 500, 10, 0);
		expect(narrow.columns).toBe(2);
		expect(narrow.itemHeight).toBeCloseTo((narrow.itemWidth * 180) / 600);
	});
	it('aligns short grids and clips overflow without changing pages', () => {
		const settings = { ...defaultRepeater(), align: 'center' as const, overflow: 'clip' as const };
		expect(gridLayout(settings, 1000, 500, 1, 10000).offsetY).toBe(160);
		expect(gridLayout(settings, 1000, 400, 20, 10000)).toMatchObject({
			page: 0,
			start: 0,
			visibleCount: 4
		});
	});
	it('scrolls down and back while rendering a bounded window of rows', () => {
		const settings = { ...defaultRepeater(), overflow: 'scroll' as const };
		const bottom = gridLayout(settings, 1000, 400, 100, 5000);
		expect(bottom.start).toBeGreaterThan(0);
		expect(bottom.visibleCount).toBeLessThanOrEqual(8);
		expect(gridLayout(settings, 1000, 400, 100, 10000).start).toBe(0);
	});
	it('formats selected row values and handles missing values without executing markup', () => {
		const row = {
			id: '1',
			label: 'Alias',
			detail: '',
			fields: { name: '<b>Plain text</b>', date: '2026-11-26T12:00:00Z', total: 1234 }
		};
		const binding = { field: 'row.name', format: 'text' as const, fallback: 'Missing' };
		expect(boundText(binding, row, 0, 'America/New_York')).toBe('<b>Plain text</b>');
		expect(
			boundText({ ...binding, field: 'row.date', format: 'date' }, row, 0, 'America/New_York')
		).toBe('Nov 26, 2026');
		expect(boundText({ ...binding, field: 'row.total', format: 'number' }, row, 0, 'UTC')).toBe(
			'1,234'
		);
		expect(boundText({ ...binding, field: '$index' }, row, 4, 'UTC')).toBe('5');
		expect(boundText({ ...binding, field: 'row.missing' }, row, 0, 'UTC')).toBe('Missing');
	});
	it('validates templates and rejects nested queries, invalid bindings, and layout limits', () => {
		const repeater = {
			...newElement('list', 'grid'),
			dataSource: { ...defaultDataSource(), model: 'Holiday', select: 'name date' },
			repeater: defaultRepeater()
		};
		const definition = { ...blankSlide(), elements: [repeater] };
		expect(validateSlide(definition).elements[0].repeater?.template.elements).toHaveLength(3);
		for (const update of [
			{ columns: -1 },
			{ columns: 1.5 },
			{ pageDurationMs: 0 },
			{ rowGap: -1 },
			{ staggerMs: -1 },
			{ staggerMs: 10001 },
			{ staggerMs: 1.5 },
			{ clip: 'visible' }
		])
			expect(() =>
				validateSlide({
					...definition,
					elements: [{ ...repeater, repeater: { ...repeater.repeater, ...update } }]
				})
			).toThrow();
		repeater.repeater.template.elements.push(newElement('list', 'nested'));
		expect(() => validateSlide(definition)).toThrow('element type');
		repeater.repeater.template.elements.pop();
		repeater.repeater.template.elements[1].binding!.field = 'row.__proto__';
		expect(() => validateSlide(definition)).toThrow('binding');
	});
	it('includes template media in prefetching and preserves editable element references', () => {
		const settings = defaultRepeater();
		settings.template.elements.push({ ...newElement('image', 'photo'), assetId: 'a'.repeat(24) });
		expect(
			mediaIds({
				...blankSlide(),
				elements: [{ ...newElement('list', 'grid'), repeater: settings }]
			})
		).toEqual(['a'.repeat(24)]);
		expect(templateSlide(settings, 10000).elements).toBe(settings.template.elements);
	});
});
