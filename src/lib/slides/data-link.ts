import { defaultDataSource, type SlideDataSource } from './types';

// Business data that an administrator can deliberately publish to monitor audiences.
// Authentication, credentials, configuration, logs, and binary assets are not query sources.
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
	'UserProfile'
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
		Object.keys(defaults).map((key) => [key, value?.[key]])
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
export function validateLink(config: SlideDataSource) {
	if (!dataModels.includes(config.model as (typeof dataModels)[number]))
		throw new Error('Choose a supported business model.');
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
	parseFilter(config.filter);
	parseSort(config.sort);
	const fields = config.select.trim().split(/\s+/).filter(Boolean);
	if (!fields.length || fields.length > 20 || fields.some((field) => !safeField(field)))
		throw new Error('Select 1–20 field names, separated by spaces.');
	for (const field of [config.labelField, config.detailField].filter(Boolean))
		if (!safeField(field) || !fields.includes(field))
			throw new Error('Display fields must be included in select.');
	if (!config.labelField) throw new Error('Choose a label field.');
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
