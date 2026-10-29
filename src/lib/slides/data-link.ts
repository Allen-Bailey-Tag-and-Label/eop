import { defaultDataSource, type SlideDataSource } from './types';

// Business data that an administrator can deliberately publish to monitor audiences.
// Credentials, configuration, logs, and binary assets are not query sources.
// User is aggregate-only; the server exposes its active flag and profile reference.
export const dataModels = [
	'Barcode',
	'Branch',
	'Customer',
	'CustomerActivity',
	'CustomerActivityDirection',
	'CustomerActivityType',
	'CustomerContact',
	'DataTableDefinition',
	'DataTableRow',
	'Holiday',
	'InventoryItem',
	'InventoryItemGroupType',
	'InventoryItemLineType',
	'InventoryItemStockingType',
	'InventoryItemUOM',
	'PhysicalInventoryItem',
	'Post',
	'QuoteFeature',
	'QuoteMarginCalculation',
	'QuoteOperation',
	'QuoteProductType',
	'QuoteSetupLabor',
	'QuoteWorkCenter',
	'SalesOpportunity',
	'SalesOpportunityStatus',
	'SchedulingModifier',
	'SchedulingProductType',
	'UpsQuote',
	'UserProfile',
	'User'
] as const;

export function normalizeDataSource(input: unknown): SlideDataSource {
	const value = input as Record<string, unknown> | undefined;
	// Keep previously saved holiday slides editable and playable.
	if (value?.source === 'upcoming-holidays') {
		return {
			...defaultDataSource(),
			model: 'Holiday',
			filter: JSON.stringify({
				date: { $gte: { $date: 'today' }, $lt: { $date: `today+${value.daysAhead}d` } }
			}),
			select: 'name date',
			sort: '{"date":1,"_id":1}',
			limit: value.limit as number,
			timeZone: value.timeZone as string,
			labelField: 'name',
			detailField: 'date',
			detailFormat: 'date'
		};
	}
	const defaults = defaultDataSource();
	return Object.fromEntries(
		Object.keys(defaults).map((key) => [
			key,
			value?.[key] ??
				(key === 'mode' || key === 'pipeline' ? defaults[key as keyof SlideDataSource] : undefined)
		])
	) as SlideDataSource;
}

export const fieldPath = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
const forbidden = new Set([
	'__proto__',
	'constructor',
	'prototype',
	'$where',
	'$function',
	'$accumulator',
	'$out',
	'$merge'
]);
export function parseFilter(text: string): Record<string, unknown> {
	const result = JSON.parse(text);
	let nodes = 0;
	function visit(value: unknown, depth: number) {
		if (++nodes > 1000 || depth > 15) throw new Error('Filter is too complex.');
		if (!value || typeof value !== 'object') return;
		for (const [key, item] of Object.entries(value)) {
			if (key.split('.').some((part) => forbidden.has(part)))
				throw new Error(`Unsupported filter key: ${key}`);
			if (
				key === '$date' &&
				(typeof item !== 'string' || !/^(?:now|today)(?:[+-]\d{1,3}d)?$/.test(item))
			)
				throw new Error('Relative dates use today, now, or today+30d.');
			if (key === '$date' && Object.keys(value).length !== 1)
				throw new Error('A relative date must be its own object.');
			visit(item, depth + 1);
		}
	}
	if (!result || typeof result !== 'object' || Array.isArray(result))
		throw new Error('Filter must be a JSON object.');
	visit(result, 0);
	return result;
}

export function parseSort(text: string): Record<string, 1 | -1> {
	const sort = JSON.parse(text);
	if (
		!sort ||
		typeof sort !== 'object' ||
		Array.isArray(sort) ||
		Object.keys(sort).length > 10 ||
		Object.entries(sort).some(([key, value]) => !safeField(key) || (value !== 1 && value !== -1))
	)
		throw new Error('Sort must be a JSON object of field names and 1 or -1.');
	return sort;
}
export function safeField(value: string) {
	return fieldPath.test(value) && !value.split('.').some((part) => forbidden.has(part));
}

export function parsePipeline(text: string): Record<string, unknown>[] {
	if (typeof text !== 'string' || text.length > 20000)
		throw new Error('Pipeline must be JSON (20 KB maximum).');
	const pipeline: unknown = JSON.parse(text);
	if (!Array.isArray(pipeline) || pipeline.length > 20)
		throw new Error('Pipeline must be an array of at most 20 stages.');
	// Reuse the bounded traversal and executable/prototype-key rejection.
	parseFilter(JSON.stringify({ pipeline }));
	const stages = new Set([
		'$match',
		'$lookup',
		'$unwind',
		'$project',
		'$set',
		'$addFields',
		'$group',
		'$sort',
		'$skip',
		'$limit'
	]);
	let joins = 0;
	for (const stage of pipeline) {
		if (
			!stage ||
			typeof stage !== 'object' ||
			Array.isArray(stage) ||
			Object.keys(stage).length !== 1
		)
			throw new Error('Each pipeline stage must contain one operator.');
		const [operator, value] = Object.entries(stage)[0];
		if (!stages.has(operator)) throw new Error(`Unsupported pipeline stage: ${operator}`);
		if (operator === '$lookup') {
			if (++joins > 3) throw new Error('Use at most three lookups.');
			if (!value || typeof value !== 'object' || Array.isArray(value))
				throw new Error('Invalid lookup.');
			const lookup = value as Record<string, unknown>;
			if (
				Object.keys(lookup).some(
					(key) => !['from', 'localField', 'foreignField', 'as'].includes(key)
				) ||
				!dataModels.includes(lookup.from as (typeof dataModels)[number]) ||
				['localField', 'foreignField', 'as'].some(
					(key) => typeof lookup[key] !== 'string' || !safeField(lookup[key] as string)
				)
			)
				throw new Error(
					'Lookup requires an allowed model name in from, localField, foreignField, and as. Nested lookup pipelines are not supported.'
				);
		}
		if (operator === '$sort') parseSort(JSON.stringify(value));
		if (
			(operator === '$skip' || operator === '$limit') &&
			(!Number.isInteger(value) ||
				Number(value) < (operator === '$limit' ? 1 : 0) ||
				Number(value) > 10000)
		)
			throw new Error('Pipeline skip/limit must be whole numbers up to 10000.');
	}
	return pipeline;
}
export function validateLink(config: SlideDataSource, requireLabel = true) {
	if (!dataModels.includes(config.model as (typeof dataModels)[number]))
		throw new Error('Choose a supported business model.');
	if (config.mode !== undefined && !['find', 'aggregate'].includes(config.mode))
		throw new Error('Choose find or aggregate query mode.');
	if (config.model === 'User' && config.mode !== 'aggregate')
		throw new Error('User is a supported business model only in aggregate mode.');
	for (const key of [
		'filter',
		'sort',
		'select',
		'labelField',
		'detailField',
		'timeZone',
		'emptyMessage'
	] as const)
		if (typeof config[key] !== 'string' || config[key].length > (key === 'filter' ? 10000 : 500))
			throw new Error(`Invalid ${key}.`);
	if (config.mode === 'aggregate') parsePipeline(config.pipeline ?? '[]');
	else parseFilter(config.filter);
	parseSort(config.sort);
	const fields = config.select.trim().split(/\s+/).filter(Boolean);
	if (!fields.length || fields.length > 20 || fields.some((field) => !safeField(field)))
		throw new Error('Select 1–20 field names, separated by spaces.');
	for (const field of [config.labelField, config.detailField].filter(Boolean))
		if (!safeField(field) || !fields.includes(field))
			throw new Error('Display fields must be included in select.');
	if (requireLabel && !config.labelField) throw new Error('Choose a label field.');
	if (!['text', 'date', 'number'].includes(config.detailFormat))
		throw new Error('Invalid detail format.');
	for (const [key, max] of [
		['skip', 10000],
		['limit', 100]
	] as const)
		if (
			!Number.isInteger(config[key]) ||
			config[key] < (key === 'limit' ? 1 : 0) ||
			config[key] > max
		)
			throw new Error(`Invalid ${key} (maximum ${max}).`);
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: config.timeZone });
	} catch {
		throw new Error('Enter a valid time zone, such as America/New_York.');
	}
}
