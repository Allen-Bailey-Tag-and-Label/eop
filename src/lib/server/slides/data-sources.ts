import { blankSlide, newElement } from '$lib/slides/types';
import { defaultRepeater, allElements } from '$lib/slides/repeater';
import type { Model, Schema } from 'mongoose';
import type {
	DataListResult,
	SlideData,
	SlideDataSource,
	SlideDefinition
} from '$lib/slides/types';
import { validateDataSource, SlideValidationError } from '$lib/slides/validation';
import { dataModels, parseFilter, parseSort } from '$lib/slides/data-link';

function availableField(schema: Schema, field: string) {
	const segments = field.split('.');
	if (/password|secret|token|credential/i.test(field)) return false;
	let found = false;
	for (let length = 1; length <= segments.length; length++) {
		const path = schema.path(segments.slice(0, length).join('.'));
		if (path?.options.select === false) return false;
		if (path && (length === segments.length || path.instance === 'Mixed')) found = true;
	}
	return found;
}
export async function getDataFields(): Promise<Record<string, string[]>> {
	const models = await import('../mongoose/models');
	return Object.fromEntries(
		dataModels.map((name) => {
			const model = models[name] as Model<Record<string, unknown>>;
			return [
				name,
				Object.keys(model.schema.paths)
					.filter((field) => availableField(model.schema, field))
					.sort()
			];
		})
	);
}

// Resolve relative dates for every request, including calendar-day offsets across DST.
export function resolveDates(value: unknown, now: Date, timeZone: string): unknown {
	if (!value || typeof value !== 'object') return value;
	if (Array.isArray(value)) return value.map((item) => resolveDates(item, now, timeZone));
	const object = value as Record<string, unknown>;
	if (typeof object.$date === 'string') {
		const token = object.$date;
		const offset = Number(token.match(/([+-]\d+)d$/)?.[1] ?? 0);
		if (token.startsWith('now')) return new Date(now.getTime() + offset * 86400000);
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(now);
		const part = (name: string) => Number(parts.find((item) => item.type === name)!.value);
		const target = Date.UTC(part('year'), part('month') - 1, part('day') + offset);
		let timestamp = target;
		const format = new Intl.DateTimeFormat('en-GB', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23'
		});
		for (let i = 0; i < 4; i++) {
			const local = format.formatToParts(new Date(timestamp));
			const get = (name: string) => Number(local.find((item) => item.type === name)!.value);
			const shown = Date.UTC(
				get('year'),
				get('month') - 1,
				get('day'),
				get('hour'),
				get('minute'),
				get('second')
			);
			const delta = target - shown;
			if (!delta) break;
			timestamp += delta;
		}
		return new Date(timestamp);
	}
	return Object.fromEntries(
		Object.entries(object).map(([key, item]) => [key, resolveDates(item, now, timeZone)])
	);
}
function read(row: Record<string, unknown>, path: string): unknown {
	return path
		.split('.')
		.reduce<unknown>(
			(value, key) =>
				value && typeof value === 'object' && Object.hasOwn(value, key)
					? (value as Record<string, unknown>)[key]
					: undefined,
			row
		);
}
function display(value: unknown, format: string, timeZone: string): string {
	if (value == null) return '';
	if (format === 'date') {
		const date = new Date(String(value));
		return Number.isFinite(date.getTime())
			? new Intl.DateTimeFormat('en-US', {
					timeZone,
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				}).format(date)
			: '';
	}
	if (format === 'number')
		return typeof value === 'number' && Number.isFinite(value)
			? new Intl.NumberFormat('en-US').format(value)
			: '';
	return ['string', 'number', 'boolean'].includes(typeof value)
		? String(value).trim().slice(0, 500)
		: '';
}
async function queryLink(config: SlideDataSource, now: Date): Promise<DataListResult> {
	const models = await import('../mongoose/models');
	const model = models[config.model as keyof typeof models] as Model<Record<string, unknown>>;
	if (!model) throw new Error('Unsupported model.');
	const fields = config.select.trim().split(/\s+/);
	// Explicit schema fields only: no projection expressions or select:false overrides.
	for (const field of [...fields, ...Object.keys(parseSort(config.sort))]) {
		if (!availableField(model.schema, field)) throw new Error(`Unavailable field: ${field}`);
	}
	const rows = await model
		.find(resolveDates(parseFilter(config.filter), now, config.timeZone) as Record<string, unknown>)
		.select(fields.join(' '))
		.sort(parseSort(config.sort))
		.skip(config.skip)
		.limit(config.limit)
		.maxTimeMS(4000)
		.lean();
	return {
		state: rows.length ? 'ready' : 'empty',
		items: rows.map((row, index) => ({
			id: String(row._id ?? index),
			fields: Object.fromEntries(
				fields.map((field) => {
					const value = read(row, field);
					return [
						field,
						value instanceof Date
							? value.toISOString()
							: typeof value === 'string'
								? value.slice(0, 5000)
								: (typeof value === 'number' && Number.isFinite(value)) ||
									  typeof value === 'boolean'
									? value
									: null
					];
				})
			),
			label:
				display(read(row, config.labelField || fields[0]), 'text', config.timeZone) || config.model,
			detail: config.detailField
				? display(read(row, config.detailField), config.detailFormat, config.timeZone)
				: !config.labelField && fields[1]
					? display(
							read(row, fields[1]),
							read(row, fields[1]) instanceof Date ? 'date' : 'text',
							config.timeZone
						)
					: ''
		})),
		message: rows.length ? '' : config.emptyMessage
	};
}
export function createSlideDataResolver(now = new Date(), preview = false) {
	const pending = new Map<string, Promise<DataListResult>>();
	return async (definition: SlideDefinition): Promise<SlideData> =>
		Object.fromEntries(
			await Promise.all(
				allElements(definition)
					.filter((element) => element.type === 'list')
					.map(async (element) => {
						let result: DataListResult;
						try {
							const config = validateDataSource(element.dataSource, !element.repeater);
							const key = JSON.stringify(config);
							if (!pending.has(key)) pending.set(key, queryLink(config, now));
							result = await pending.get(key)!;
						} catch (cause) {
							console.error('Unable to load slide data link', cause);
							result = {
								state: 'error',
								items: [],
								message:
									preview && cause instanceof Error
										? cause.message.slice(0, 500)
										: 'Data is temporarily unavailable.'
							};
						}
						return [element.id, result];
					})
			)
		);
}

// Query previews must work while unrelated geometry, templates, and assets are unfinished.
// Full slide validation still runs when saving or publishing.
export async function previewSlideData(input: unknown, now = new Date()): Promise<SlideData> {
	if (
		!input ||
		typeof input !== 'object' ||
		!Array.isArray((input as { elements?: unknown }).elements)
	)
		throw new SlideValidationError('Preview requires a slide with elements.');
	let count = 0;
	const collect = (rows: unknown[], depth = 0): unknown[] => {
		if (rows.length > 100)
			throw new SlideValidationError('Use at most 100 elements per container.');
		if (depth > 8) throw new SlideValidationError('Use at most eight nested frame levels.');
		return rows.flatMap((raw) => {
			if (++count > 500) throw new SlideValidationError('Use at most 500 elements.');
			if (!raw || typeof raw !== 'object') return [raw];
			const frame = (raw as { frame?: { elements?: unknown } }).frame;
			return [raw, ...(Array.isArray(frame?.elements) ? collect(frame.elements, depth + 1) : [])];
		});
	};
	const rawElements = collect((input as { elements: unknown[] }).elements);
	if (rawElements.length > 500) throw new SlideValidationError('Use at most 500 elements.');
	const ids = new Set<string>();
	const elements = rawElements
		.filter(
			(raw): raw is Record<string, unknown> =>
				!!raw && typeof raw === 'object' && (raw as { type?: unknown }).type === 'list'
		)
		.map((raw) => {
			const id = raw.id;
			if (typeof id !== 'string' || id.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id))
				throw new SlideValidationError('Data preview elements need unique valid IDs.');
			ids.add(id);
			return {
				...newElement('list', id),
				dataSource: raw.dataSource as SlideDataSource,
				...(raw.repeater ? { repeater: defaultRepeater() } : {})
			};
		});
	return createSlideDataResolver(now, true)({ ...blankSlide(), elements });
}
