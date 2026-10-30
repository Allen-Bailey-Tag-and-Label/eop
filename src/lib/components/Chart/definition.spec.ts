import { describe, expect, it } from 'vitest';
import { defaultChart, chartData, validateChart } from './definition';
import { blankSlide, newElement } from '$lib/slides/types';
import { validateSlide } from '$lib/slides/validation';
import { defaultRepeater } from '$lib/slides/repeater';
describe('chart definitions', () => {
	it('maps flat dotted output fields to safe internal numeric columns', () => {
		const settings = {
			...defaultChart(),
			series: [{ field: 'sales.total', label: 'Sales', color: '#2563eb' }]
		};
		const result = chartData(settings, [{ label: 'Mon', 'sales.total': 25 }]);
		expect(result.data[0]).toMatchObject({ _chartX: 'Mon', _chartValue0: 25 });
	});
	it('preserves settings in slide JSON including nested repeater templates', () => {
		const chart = newElement('chart', 'sales');
		chart.chart!.kind = 'area';
		chart.chart!.series.push({ field: 'target', label: 'Target', color: '#ff000080' });
		const wrapper = {
			...newElement('repeater', 'repeated'),
			repeatItems: { mode: 'count' as const, count: 2 },
			repeater: { ...defaultRepeater(), template: { width: 1200, height: 650, elements: [chart] } }
		};
		const saved = validateSlide(
			JSON.parse(JSON.stringify({ ...blankSlide(), elements: [wrapper] }))
		);
		expect(saved.elements[0].repeater!.template.elements[0].chart).toEqual(chart.chart);
	});
	it('rejects invalid chart options and executable or nested row data', () => {
		for (const override of [
			{ kind: 'execute' },
			{ xField: '__proto__.value' },
			{ series: [] },
			{ fontSize: 0 },
			{ innerRadius: 1 },
			{ palette: ['url(javascript:bad)'] },
			{ rows: [{ label: 'A', value: Infinity }] },
			{ rows: [{ label: 'A', value: { nested: 2 } }] }
		])
			expect(() => validateChart({ ...defaultChart(), ...override })).toThrow();
	});
	it('sorts numeric/date axes, preserves category order, and omits missing values without coercing them to zero', () => {
		const settings = { ...defaultChart(), xType: 'number' as const };
		const result = chartData(settings, [
			{ label: 3, value: 4 },
			{ label: 1, value: 2 },
			{ label: 2, value: null }
		]);
		expect(result.data.map((row) => row._chartX)).toEqual([1, 3]);
		expect(result.omitted).toBe(1);
		expect(
			chartData(defaultChart(), [
				{ label: 'B', value: 1 },
				{ label: 'A', value: 2 }
			]).data.map((row) => row._chartX)
		).toEqual(['B', 'A']);
		const dates = chartData({ ...settings, xType: 'date' }, [
			{ label: '2026-02-02', value: 1 },
			{ label: '2026-01-01', value: 2 },
			{ label: 'invalid', value: 3 }
		]);
		expect(dates.data[0]._chartX).toEqual(new Date('2026-01-01'));
		expect(dates.omitted).toBe(1);
	});
	it('uses only the first radial series and rejects negative radial values', () => {
		const settings = {
			...defaultChart(),
			kind: 'pie' as const,
			series: [...defaultChart().series, { field: 'unused', label: 'Unused', color: '#ffffff' }]
		};
		expect(
			chartData(settings, [
				{ label: 'A', value: 2 },
				{ label: 'B', value: -1 }
			]).data
		).toHaveLength(1);
	});
});
