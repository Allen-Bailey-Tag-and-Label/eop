import { safeField, parseSort, validateLink, normalizeDataSource } from '$lib/slides/data-link';
import { apiEndpointPath } from './api-path';
import {
	DataWorkflowError,
	type DataRecord,
	type Expression,
	type WorkflowDefinition,
	type WorkflowNode
} from './types';
import type { DataValue } from '$lib/slides/types';

function reject(message: string): never {
	throw new DataWorkflowError(message);
}
export const record = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: reject('Expected a JSON object.');
const scalar = (value: unknown): value is DataValue =>
	value === null ||
	typeof value === 'string' ||
	typeof value === 'boolean' ||
	(typeof value === 'number' && Number.isFinite(value));
export const readField = (row: Record<string, unknown>, path: string): unknown => {
	if (!safeField(path)) return undefined;
	if (Object.hasOwn(row, path)) return row[path];
	return path
		.split('.')
		.reduce<unknown>(
			(value, key) =>
				value && typeof value === 'object' && Object.hasOwn(value, key)
					? (value as Record<string, unknown>)[key]
					: undefined,
			row
		);
};
export function dataRecord(value: unknown): DataRecord {
	const object = record(value);
	if (Object.keys(object).length > 40) reject('Use at most 40 fields per row.');
	return Object.fromEntries(
		Object.entries(object).map(([key, item]) => {
			if (!safeField(key) || !scalar(item))
				reject('Rows must use named fields with finite primitive values.');
			if (typeof item === 'string' && item.length > 5000)
				reject('Data strings must be at most 5000 characters.');
			return [key, item];
		})
	) as DataRecord;
}
const operations = new Set([
	'if',
	'and',
	'or',
	'not',
	'concat',
	'coalesce',
	'add',
	'subtract',
	'multiply',
	'divide',
	'round',
	'lower',
	'upper',
	'month',
	'day',
	'date',
	'eq',
	'gt',
	'lt'
]);
export function validateExpression(value: unknown, depth = 0): Expression {
	if (depth > 10) reject('Expressions may nest at most ten levels.');
	if (scalar(value)) return value;
	const expression = record(value);
	if (
		Object.keys(expression).length === 1 &&
		typeof expression.field === 'string' &&
		safeField(expression.field)
	)
		return { field: expression.field };
	if (
		Object.keys(expression).length === 1 &&
		typeof expression.param === 'string' &&
		safeField(expression.param)
	)
		return { param: expression.param };
	if (
		Object.keys(expression).length !== 2 ||
		!operations.has(String(expression.op)) ||
		!Array.isArray(expression.args) ||
		expression.args.length > 20
	)
		reject('Choose a supported expression operation and an args array.');
	const length = (expression.args as unknown[]).length;
	const op = String(expression.op);
	if ((op === 'if' && length !== 3) || (op === 'not' && length !== 1))
		reject('Incorrect argument count for expression operation.');
	if (
		!length ||
		(['subtract'].includes(op) && length < 2) ||
		(['divide', 'eq', 'gt', 'lt'].includes(op) && length !== 2) ||
		(['round', 'lower', 'upper'].includes(op) && length !== 1) ||
		(['month', 'day', 'date'].includes(op) && length > 2)
	)
		reject('Incorrect argument count for expression operation.');
	return {
		op: String(expression.op),
		args: (expression.args as unknown[]).map((arg) => validateExpression(arg, depth + 1))
	};
}
export function evaluate(
	expression: Expression,
	row: DataRecord,
	params: DataRecord,
	now = new Date(),
	timeZone = 'UTC'
): DataValue {
	if (scalar(expression)) return expression;
	if ('field' in expression) return (readField(row, expression.field) as DataValue) ?? null;
	if ('param' in expression) {
		if (!Object.hasOwn(params, expression.param)) reject(`Missing parameter: ${expression.param}`);
		return params[expression.param];
	}
	if (expression.op === 'if')
		return evaluate(
			expression.args[evaluate(expression.args[0], row, params, now, timeZone) ? 1 : 2],
			row,
			params,
			now,
			timeZone
		);
	const args = expression.args.map((arg) => evaluate(arg, row, params, now, timeZone));
	const numbers = () =>
		args.map((arg) => {
			const value = Number(arg);
			return Number.isFinite(value)
				? value
				: reject('A numeric expression received a nonnumeric value.');
		});
	let result: DataValue;
	switch (expression.op) {
		case 'and':
			result = args.every(Boolean);
			break;
		case 'or':
			result = args.some(Boolean);
			break;
		case 'not':
			result = !args[0];
			break;
		case 'concat':
			result = args.map((arg) => arg ?? '').join('');
			break;
		case 'coalesce':
			result = args.find((arg) => arg !== null && arg !== '') ?? null;
			break;
		case 'add':
			result = numbers().reduce((a, b) => a + b, 0);
			break;
		case 'subtract':
			result = numbers().reduce((a, b) => a - b);
			break;
		case 'multiply':
			result = numbers().reduce((a, b) => a * b, 1);
			break;
		case 'divide': {
			const [a, b] = numbers();
			result = b ? a / b : null;
			break;
		}
		case 'round':
			result = Math.round(numbers()[0]);
			break;
		case 'lower':
			result = String(args[0] ?? '').toLowerCase();
			break;
		case 'upper':
			result = String(args[0] ?? '').toUpperCase();
			break;
		case 'eq':
			result = args[0] === args[1];
			break;
		case 'gt':
			result = Number(args[0]) > Number(args[1]);
			break;
		case 'lt':
			result = Number(args[0]) < Number(args[1]);
			break;
		case 'month':
		case 'day':
		case 'date': {
			const date = args[0] === 'now' ? now : new Date(String(args[0]));
			if (!Number.isFinite(date.getTime())) return null;
			const zone = typeof args[1] === 'string' ? args[1] : timeZone;
			if (expression.op === 'date')
				result = new Intl.DateTimeFormat('en-US', {
					timeZone: zone,
					month: 'short',
					day: 'numeric'
				}).format(date);
			else
				result = Number(
					new Intl.DateTimeFormat('en-US', {
						timeZone: zone,
						[expression.op === 'month' ? 'month' : 'day']: 'numeric'
					}).format(date)
				);
			break;
		}
		default:
			return reject('Unsupported expression.');
	}
	if (!scalar(result) || (typeof result === 'string' && result.length > 5000))
		reject('Expression result is too large or nonfinite.');
	return result;
}
export function substituteParameters(value: unknown, params: DataRecord): unknown {
	if (Array.isArray(value)) return value.map((item) => substituteParameters(item, params));
	if (!value || typeof value !== 'object') return value;
	const object = record(value);
	if (Object.keys(object).length === 1 && typeof object.$param === 'string') {
		if (!Object.hasOwn(params, object.$param)) reject(`Missing parameter: ${object.$param}`);
		return params[object.$param];
	}
	return Object.fromEntries(
		Object.entries(object).map(([key, item]) => [key, substituteParameters(item, params)])
	);
}
export function validateWorkflow(input: unknown): WorkflowDefinition {
	if ((JSON.stringify(input)?.length ?? 0) > 200000) reject('Workflow must be at most 200 KB.');
	const value = record(input);
	if (
		value.schemaVersion !== 1 ||
		!Array.isArray(value.nodes) ||
		value.nodes.length < 1 ||
		value.nodes.length > 30
	)
		reject('Use schemaVersion 1 and between 1 and 30 nodes.');
	let count = 0;
	const inspect = (item: unknown, depth = 0) => {
		if (++count > 20000 || depth > 30) reject('Workflow JSON is too complex.');
		if (!item || typeof item !== 'object') return;
		for (const [key, child] of Object.entries(item)) {
			if (
				[
					'__proto__',
					'constructor',
					'prototype',
					'$where',
					'$function',
					'$accumulator',
					'$out',
					'$merge'
				].includes(key)
			)
				reject(`Unsupported workflow key: ${key}`);
			inspect(child, depth + 1);
		}
	};
	inspect(value);
	const parameters = dataRecord(value.parameters ?? {});
	const nodes = value.nodes.map((raw): WorkflowNode => {
		const node = record(raw);
		if (typeof node.id !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(node.id))
			reject('Node IDs must be short names starting with a letter.');
		if (
			!['database', 'api', 'literal', 'join', 'filter', 'map', 'sort', 'group'].includes(
				String(node.type)
			)
		)
			reject('Choose a supported node type.');
		if (!Array.isArray(node.inputs) || node.inputs.some((id) => typeof id !== 'string'))
			reject('Node inputs must be node IDs.');
		const expected = ['database', 'api', 'literal'].includes(String(node.type))
			? 0
			: node.type === 'join'
				? 2
				: 1;
		if (node.inputs.length !== expected) reject(`${node.id} needs ${expected} inputs.`);
		const config = record(node.config);
		if (node.type === 'database') validateLink(normalizeDataSource(config.query), false);
		if (node.type === 'literal') {
			if (!Array.isArray(config.rows) || config.rows.length > 500)
				reject('Literal rows must be an array of at most 500 rows.');
			config.rows.forEach(dataRecord);
		}
		if (node.type === 'api') {
			if (typeof config.connectionId !== 'string' || !/^[a-f0-9]{24}$/i.test(config.connectionId))
				reject('Choose an API connection.');
			if (!apiEndpointPath(config.path))
				reject('API paths must be absolute endpoint paths without query strings.');
			if (
				config.itemsPath !== '' &&
				(typeof config.itemsPath !== 'string' || !safeField(config.itemsPath))
			)
				reject('Choose the response array path.');
			const fields = record(config.fields);
			if (
				!Object.keys(fields).length ||
				Object.keys(fields).length > 40 ||
				Object.entries(fields).some(
					([key, path]) => !safeField(key) || typeof path !== 'string' || !safeField(path)
				)
			)
				reject('API fields map output names to response field paths.');
			record(config.query ?? {});
		}
		if (node.type === 'map') {
			const fields = record(config.fields);
			if (Object.keys(fields).length > 40 || Object.keys(fields).some((key) => !safeField(key)))
				reject('Invalid map output fields.');
			Object.values(fields).forEach((expr) => validateExpression(expr));
		}
		if (node.type === 'sort') parseSort(JSON.stringify(config.fields));
		if (
			node.type === 'join' &&
			(['leftKey', 'rightKey', 'prefix'].some(
				(key) => typeof config[key] !== 'string' || !safeField(config[key] as string)
			) ||
				!['inner', 'left'].includes(String(config.mode)))
		)
			reject('Join needs leftKey, rightKey, prefix, and inner/left mode.');
		if (node.type === 'filter') {
			if (
				!['all', 'any'].includes(String(config.match)) ||
				!Array.isArray(config.rules) ||
				config.rules.length > 20
			)
				reject('Filter needs all/any match and up to 20 rules.');
			for (const rule of config.rules) {
				const item = record(rule);
				if (
					typeof item.field !== 'string' ||
					!safeField(item.field) ||
					!['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains'].includes(String(item.operator))
				)
					reject('Invalid filter rule.');
				validateExpression(item.value);
			}
		}
		if (node.type === 'group') {
			if (config.key !== '' && (typeof config.key !== 'string' || !safeField(config.key)))
				reject('Invalid group key.');
			const fields = record(config.fields);
			if (Object.keys(fields).length > 20) reject('Use at most 20 group measures.');
			for (const [key, raw] of Object.entries(fields)) {
				const measure = record(raw);
				if (
					!safeField(key) ||
					!['count', 'sum', 'avg', 'min', 'max'].includes(String(measure.op)) ||
					(measure.op !== 'count' &&
						(typeof measure.field !== 'string' || !safeField(measure.field)))
				)
					reject('Invalid group measure.');
			}
		}
		return {
			id: node.id as string,
			...(node.position
				? (() => {
						const position = record(node.position);
						if (
							![position.x, position.y].every(
								(n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 5000
							)
						)
							reject('Node positions must be between 0 and 5000.');
						return { position: { x: position.x as number, y: position.y as number } };
					})()
				: {}),
			type: node.type as WorkflowNode['type'],
			inputs: node.inputs as string[],
			config
		};
	});
	const byId = new Map(nodes.map((node) => [node.id, node]));
	if (byId.size !== nodes.length) reject('Node IDs must be unique.');
	const visited = new Set<string>(),
		visiting = new Set<string>();
	const visit = (id: string) => {
		if (visiting.has(id)) reject('Workflow connections cannot form a cycle.');
		if (visited.has(id)) return;
		const node = byId.get(id);
		if (!node) reject(`Unknown input node: ${id}`);
		visiting.add(id);
		node!.inputs.forEach(visit);
		visiting.delete(id);
		visited.add(id);
	};
	nodes.forEach((node) => visit(node.id));
	const outputs = record(value.outputs);
	if (!Object.keys(outputs).length || Object.keys(outputs).length > 10)
		reject('Create between 1 and 10 named outputs.');
	for (const [name, raw] of Object.entries(outputs)) {
		const output = record(raw);
		if (
			!safeField(name) ||
			!byId.has(String(output.nodeId)) ||
			!Array.isArray(output.fields) ||
			!output.fields.length ||
			output.fields.length > 40 ||
			output.fields.some((field) => typeof field !== 'string' || !safeField(field)) ||
			(output.idField !== '' && (typeof output.idField !== 'string' || !safeField(output.idField)))
		)
			reject('Outputs need a name, nodeId, selected fields, and optional idField.');
	}
	const refreshSeconds = Number(value.refreshSeconds ?? 0),
		staleSeconds = Number(value.staleSeconds ?? 0);
	if (![refreshSeconds, staleSeconds].every((n) => Number.isInteger(n) && n >= 0 && n <= 86400))
		reject('Refresh/stale seconds must be whole numbers from 0 to 86400.');
	return {
		schemaVersion: 1,
		parameters,
		nodes,
		outputs: outputs as WorkflowDefinition['outputs'],
		refreshSeconds,
		staleSeconds
	};
}

export async function executeWorkflow(
	definition: WorkflowDefinition,
	overrides: DataRecord,
	adapters: {
		database: (query: unknown, params: DataRecord) => Promise<DataRecord[]>;
		api: (config: Record<string, unknown>, params: DataRecord) => Promise<DataRecord[]>;
	},
	now = new Date(),
	previewAll = false
) {
	const params = { ...definition.parameters, ...dataRecord(overrides) };
	for (const key of Object.keys(params))
		if (!Object.hasOwn(definition.parameters, key)) reject(`Unknown parameter: ${key}`);
	const byId = new Map(definition.nodes.map((node) => [node.id, node]));
	const pending = new Map<string, Promise<DataRecord[]>>();
	let totalBytes = 0;
	const load = (id: string): Promise<DataRecord[]> => {
		if (pending.has(id)) return pending.get(id)!;
		const node = byId.get(id)!;
		const promise = (async () => {
			const inputs = await Promise.all(node.inputs.map(load));
			const config = node.config;
			let rows: DataRecord[] = [];
			if (node.type === 'database') rows = await adapters.database(config.query, params);
			if (node.type === 'api') rows = await adapters.api(config, params);
			if (node.type === 'literal') rows = (config.rows as unknown[]).map(dataRecord);
			if (node.type === 'map')
				rows = inputs[0].map((row) =>
					Object.fromEntries(
						Object.entries(config.fields as Record<string, Expression>).map(([key, expr]) => [
							key,
							evaluate(expr, row, params, now)
						])
					)
				);
			if (node.type === 'filter')
				rows = inputs[0].filter((row) => {
					const matches = (
						config.rules as { field: string; operator: string; value: Expression }[]
					).map((rule) => {
						const left = readField(row, rule.field) ?? null,
							right = evaluate(rule.value, row, params, now);
						if (rule.operator === 'eq') return left === right;
						if (rule.operator === 'neq') return left !== right;
						if (rule.operator === 'contains')
							return String(left ?? '').includes(String(right ?? ''));
						if (left === null || right === null) return false;
						if (rule.operator === 'gt') return left > right;
						if (rule.operator === 'gte') return left >= right;
						if (rule.operator === 'lt') return left < right;
						return left <= right;
					});
					return config.match === 'all' ? matches.every(Boolean) : matches.some(Boolean);
				});
			if (node.type === 'sort') {
				const fields = Object.entries(config.fields as Record<string, 1 | -1>);
				rows = [...inputs[0]].sort((a, b) => {
					for (const [key, direction] of fields) {
						const left = readField(a, key),
							right = readField(b, key);
						const diff =
							typeof left === 'number' && typeof right === 'number'
								? left - right
								: String(left ?? '').localeCompare(String(right ?? ''));
						if (diff) return diff * direction;
					}
					return 0;
				});
			}
			if (node.type === 'join') {
				for (const left of inputs[0]) {
					const key = readField(left, String(config.leftKey));
					const matches =
						key == null
							? []
							: inputs[1].filter((right) => readField(right, String(config.rightKey)) === key);
					if (!matches.length && config.mode === 'left') rows.push({ ...left });
					for (const right of matches) {
						rows.push({
							...left,
							...Object.fromEntries(
								Object.entries(right).map(([key, value]) => [`${config.prefix}_${key}`, value])
							)
						});
						if (rows.length > 500) reject('Join exceeds 500 rows; narrow its inputs.');
					}
				}
			}
			if (node.type === 'group') {
				const groups = new Map<DataValue, DataRecord[]>();
				for (const row of inputs[0]) {
					const key = config.key
						? ((readField(row, String(config.key)) as DataValue) ?? null)
						: null;
					if (!groups.has(key)) groups.set(key, []);
					groups.get(key)!.push(row);
				}
				if (!config.key && !groups.size) groups.set(null, []);
				rows = [...groups].map(([key, items]) => {
					const result: DataRecord = { key };
					for (const [name, raw] of Object.entries(
						config.fields as Record<string, { op: string; field?: string }>
					)) {
						const values = items
							.map((row) => readField(row, raw.field ?? ''))
							.filter(
								(value): value is number => typeof value === 'number' && Number.isFinite(value)
							);
						const sum = values.reduce((a, b) => a + b, 0);
						result[name] =
							raw.op === 'count'
								? items.length
								: raw.op === 'sum'
									? sum
									: !values.length
										? null
										: raw.op === 'avg'
											? sum / values.length
											: raw.op === 'min'
												? Math.min(...values)
												: Math.max(...values);
					}
					return result;
				});
			}
			if (rows.length > 500) reject('A workflow node returned more than 500 rows.');
			const result = rows.map(dataRecord);
			totalBytes += JSON.stringify(result).length;
			if (totalBytes > 2 * 1024 * 1024) reject('Workflow intermediate data exceeds 2 MB.');
			return result;
		})().catch((cause) => {
			throw new DataWorkflowError(
				`Node ${id}: ${cause instanceof DataWorkflowError ? cause.message : 'Execution failed. Check node values.'}`
			);
		});
		pending.set(id, promise);
		return promise;
	};
	const outputs: Record<string, DataRecord[]> = Object.fromEntries(
		await Promise.all(
			Object.entries(definition.outputs).map(async ([name, output]) => {
				const counts = new Map<string, number>();
				const rows = (await load(output.nodeId)).map((row) => {
					const fields = Object.fromEntries(
						output.fields.map((field) => [field, (readField(row, field) as DataValue) ?? null])
					);
					const identity = String(
						(output.idField ? readField(row, output.idField) : (row.id ?? row._id)) ??
							JSON.stringify(fields)
					);
					let hash = 2166136261;
					for (let i = 0; i < identity.length; i++)
						hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619);
					const base = (hash >>> 0).toString(16),
						count = counts.get(base) ?? 0;
					counts.set(base, count + 1);
					return { ...fields, _rowId: `${base}-${count}` };
				});
				return [name, rows];
			})
		)
	);
	if (previewAll) await Promise.all(definition.nodes.map((node) => load(node.id)));
	const nodes: Record<string, DataRecord[]> = Object.fromEntries(
		await Promise.all([...pending].map(async ([id, result]) => [id, await result]))
	);
	if (JSON.stringify(outputs).length > 1024 * 1024) reject('Workflow output exceeds 1 MB.');
	return {
		outputs,
		nodes: Object.fromEntries(Object.entries(nodes).map(([id, rows]) => [id, rows.slice(0, 20)])),
		updatedAt: now.toISOString()
	};
}
