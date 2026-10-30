export const chartKinds = ['line', 'bar', 'area', 'scatter', 'pie', 'arc'] as const;
export type ChartKind = (typeof chartKinds)[number];
export type ChartColor = string | { light: string; dark: string };
export type ChartRow = Record<string, string | number | boolean | null>;
export type ChartDefinition = {
	kind: ChartKind;
	xField: string;
	xType: 'category' | 'number' | 'date';
	series: { field: string; label: string; color: ChartColor }[];
	orientation: 'vertical' | 'horizontal';
	stacked: boolean;
	axis: boolean;
	grid: boolean;
	legend: boolean;
	points: boolean;
	innerRadius: number;
	fontSize: number;
	palette: ChartColor[];
	rows: ChartRow[];
};
export const defaultChart = (): ChartDefinition => ({
	kind: 'line',
	xField: 'label',
	xType: 'category',
	series: [{ field: 'value', label: 'Value', color: { light: '#2563eb', dark: '#60a5fa' } }],
	orientation: 'vertical',
	stacked: false,
	axis: true,
	grid: true,
	legend: true,
	points: true,
	innerRadius: 0,
	fontSize: 20,
	palette: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'],
	rows: [
		{ label: 'Mon', value: 25 },
		{ label: 'Tue', value: 40 },
		{ label: 'Wed', value: 32 },
		{ label: 'Thu', value: 60 },
		{ label: 'Fri', value: 48 }
	]
});
export class ChartDefinitionError extends Error {}
function invalid(message: string): never {
	throw new ChartDefinitionError(message);
}
const field = (value: unknown): value is string =>
	typeof value === 'string' &&
	/^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(value) &&
	!value.split('.').some((part) => ['__proto__', 'constructor', 'prototype'].includes(part)) &&
	value.length <= 160;
function color(value: unknown): ChartColor {
	const valid = (item: unknown): item is string =>
		typeof item === 'string' && /^(transparent|#[a-f0-9]{6}(?:[a-f0-9]{2})?)$/i.test(item);
	if (valid(value)) return value;
	if (
		value &&
		typeof value === 'object' &&
		'light' in value &&
		'dark' in value &&
		valid(value.light) &&
		valid(value.dark)
	)
		return { light: value.light, dark: value.dark };
	return invalid('Choose valid light/dark chart series colors.');
}
export function validateChart(input: unknown): ChartDefinition {
	if (!input || typeof input !== 'object' || Array.isArray(input))
		return invalid('Choose a chart configuration.');
	const value = input as Record<string, unknown>;
	if (
		!chartKinds.includes(value.kind as ChartKind) ||
		!['category', 'number', 'date'].includes(String(value.xType)) ||
		!['vertical', 'horizontal'].includes(String(value.orientation)) ||
		!field(value.xField)
	)
		return invalid('Choose a chart type, axis type, orientation and X field.');
	if (!Array.isArray(value.series) || !value.series.length || value.series.length > 12)
		return invalid('Use between 1 and 12 chart series.');
	const series = value.series.map((raw) => {
		if (
			!raw ||
			typeof raw !== 'object' ||
			!field(raw.field) ||
			typeof raw.label !== 'string' ||
			raw.label.length > 160
		)
			return invalid('Each chart series needs a field and label.');
		return { field: raw.field, label: raw.label, color: color(raw.color) };
	});
	if (new Set(series.map((item) => item.field)).size !== series.length)
		return invalid('Chart series fields must be unique.');
	for (const key of ['stacked', 'axis', 'grid', 'legend', 'points'])
		if (typeof value[key] !== 'boolean') invalid('Chart display options must be true or false.');
	if (
		typeof value.innerRadius !== 'number' ||
		!Number.isFinite(value.innerRadius) ||
		value.innerRadius < 0 ||
		value.innerRadius > 0.9
	)
		return invalid('Inner radius must be between 0 and 0.9.');
	if (!Array.isArray(value.rows) || value.rows.length > 500)
		return invalid('Use at most 500 chart rows.');
	if (
		typeof value.fontSize !== 'number' ||
		!Number.isFinite(value.fontSize) ||
		value.fontSize < 8 ||
		value.fontSize > 80
	)
		invalid('Chart font size must be between 8 and 80.');
	if (!Array.isArray(value.palette) || !value.palette.length || value.palette.length > 12)
		invalid('Use between 1 and 12 chart palette colors.');
	const palette = value.palette.map(color);
	const rows = value.rows.map((raw) => {
		if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).length > 40)
			return invalid('Chart rows must be flat records.');
		for (const [key, item] of Object.entries(raw))
			if (
				!field(key) ||
				!(
					item === null ||
					typeof item === 'boolean' ||
					(typeof item === 'number' && Number.isFinite(item)) ||
					(typeof item === 'string' && item.length <= 2000)
				)
			)
				invalid('Chart row values must be text, finite numbers, booleans or null.');
		return { ...raw } as ChartRow;
	});
	return {
		kind: value.kind as ChartKind,
		xField: value.xField,
		xType: value.xType as ChartDefinition['xType'],
		series,
		orientation: value.orientation as ChartDefinition['orientation'],
		stacked: value.stacked as boolean,
		axis: value.axis as boolean,
		grid: value.grid as boolean,
		legend: value.legend as boolean,
		points: value.points as boolean,
		innerRadius: value.innerRadius,
		fontSize: value.fontSize,
		palette,
		rows
	};
}
export function chartData(settings: ChartDefinition, rows: ChartRow[]) {
	const read = (row: ChartRow, key: string) => row[key];
	const radial = settings.kind === 'pie' || settings.kind === 'arc';
	const data = rows.slice(0, 500).flatMap((row) => {
		const raw = read(row, settings.xField);
		const x =
			settings.xType === 'date' && !radial
				? typeof raw === 'string' || typeof raw === 'number'
					? new Date(raw)
					: null
				: settings.xType === 'number' && !radial
					? typeof raw === 'number'
						? raw
						: null
					: typeof raw === 'string' || typeof raw === 'number'
						? String(raw)
						: null;
		if (
			x === null ||
			(typeof x === 'number' && !Number.isFinite(x)) ||
			(x instanceof Date && !Number.isFinite(x.getTime()))
		)
			return [];
		const values = (radial ? settings.series.slice(0, 1) : settings.series).map((series) =>
			read(row, series.field)
		);
		if (
			!values.every((value) => typeof value === 'number' && Number.isFinite(value)) ||
			(radial && Number(values[0]) < 0)
		)
			return [];
		return [
			{
				...row,
				...Object.fromEntries(values.map((value, index) => [`_chartValue${index}`, value])),
				_chartX: x
			}
		];
	});
	if (settings.xType !== 'category' && !radial)
		data.sort((a, b) => Number(a._chartX) - Number(b._chartX));
	return { data, omitted: Math.min(rows.length, 500) - data.length };
}
