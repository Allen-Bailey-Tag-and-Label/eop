import { describe, expect, it, vi } from 'vitest';
import { blankWorkflow } from './types';
import {
	executeWorkflow,
	validateWorkflow,
	validateExpression,
	evaluate,
	substituteParameters
} from './workflows';
import { defaultDataSource } from '$lib/slides/types';

describe('reusable data workflows', () => {
	it('executes a graph with shared inputs, joins, maps, filters, grouping and named outputs', async () => {
		const definition = validateWorkflow({
			schemaVersion: 1,
			parameters: { minimum: 60 },
			refreshSeconds: 30,
			staleSeconds: 60,
			nodes: [
				{
					id: 'employees',
					type: 'database',
					inputs: [],
					config: { query: { ...defaultDataSource(), model: 'UserProfile', select: 'firstName' } }
				},
				{
					id: 'metrics',
					type: 'api',
					inputs: [],
					config: {
						connectionId: 'a'.repeat(24),
						path: '/rows',
						itemsPath: 'rows',
						query: {},
						fields: { id: 'id', score: 'score' }
					}
				},
				{
					id: 'joined',
					type: 'join',
					inputs: ['employees', 'metrics'],
					config: { leftKey: 'id', rightKey: 'id', prefix: 'metrics', mode: 'left' }
				},
				{
					id: 'selected',
					type: 'filter',
					inputs: ['joined'],
					config: {
						match: 'all',
						rules: [{ field: 'metrics_score', operator: 'gte', value: { param: 'minimum' } }]
					}
				},
				{
					id: 'mapped',
					type: 'map',
					inputs: ['selected'],
					config: {
						fields: {
							id: { field: 'id' },
							name: { op: 'concat', args: [{ field: 'firstName' }, '!'] },
							score: { field: 'metrics_score' }
						}
					}
				},
				{ id: 'sorted', type: 'sort', inputs: ['mapped'], config: { fields: { score: -1 } } },
				{
					id: 'summary',
					type: 'group',
					inputs: ['mapped'],
					config: {
						key: '',
						fields: { count: { op: 'count' }, average: { op: 'avg', field: 'score' } }
					}
				}
			],
			outputs: {
				people: { nodeId: 'sorted', fields: ['id', 'name', 'score'], idField: 'id' },
				summary: { nodeId: 'summary', fields: ['count', 'average'], idField: '' }
			}
		});
		const database = vi.fn(async () => [
			{ id: 'a', firstName: 'Alice', private: 'exclude' },
			{ id: 'b', firstName: 'Bob', private: 'exclude' },
			{ id: 'c', firstName: 'Missing', private: 'exclude' }
		]);
		const api = vi.fn(async () => [
			{ id: 'a', score: 70 },
			{ id: 'b', score: 90 }
		]);
		const result = await executeWorkflow(
			definition,
			{},
			{ database, api },
			new Date('2026-10-30T12:00:00Z')
		);
		expect(result.outputs.people.map((row) => row.name)).toEqual(['Bob!', 'Alice!']);
		expect(result.outputs.summary[0]).toMatchObject({ count: 2, average: 80 });
		expect(JSON.stringify(result.outputs)).not.toContain('exclude');
		expect(database).toHaveBeenCalledOnce();
		expect(api).toHaveBeenCalledOnce();
		const filtered = await executeWorkflow(definition, { minimum: 80 }, { database, api });
		expect(filtered.outputs.people).toHaveLength(1);
		expect(filtered.outputs.people[0]._rowId).toBe(result.outputs.people[0]._rowId);
	});
	it('rejects cycles, missing nodes, executable expressions, malformed inputs and unknown parameters', async () => {
		const base = blankWorkflow();
		for (const change of [
			{ nodes: [{ id: 'rows', type: 'sort', inputs: ['rows'], config: { fields: { name: 1 } } }] },
			{
				nodes: [{ id: 'rows', type: 'sort', inputs: ['missing'], config: { fields: { name: 1 } } }]
			},
			{
				nodes: [
					{
						id: 'rows',
						type: 'map',
						inputs: ['rows'],
						config: { fields: { value: { op: 'eval', args: ['run()'] } } }
					}
				]
			},
			{ nodes: [{ id: 'rows', type: 'literal', inputs: [], config: { rows: [{ nested: {} }] } }] },
			{ outputs: { bad: { nodeId: 'missing', fields: ['name'], idField: '' } } },
			{ refreshSeconds: -1 }
		])
			expect(() => validateWorkflow({ ...base, ...change })).toThrow();
		expect(() =>
			validateWorkflow(JSON.parse('{"schemaVersion":1,"nodes":[],"__proto__":{}}'))
		).toThrow();
		expect(() => validateExpression({ op: 'divide', args: [] })).toThrow();
		await expect(
			executeWorkflow(base, { extra: 1 }, { database: vi.fn(), api: vi.fn() })
		).rejects.toThrow('Unknown parameter');
	});
	it('resolves parameter values without interpolating executable query syntax and handles calendar dates', () => {
		expect(
			substituteParameters({ name: { $param: 'name' } }, { name: '{"$where":"run()"}' })
		).toEqual({ name: '{"$where":"run()"}' });
		const now = new Date('2026-11-01T02:00:00Z');
		expect(
			evaluate(validateExpression({ op: 'month', args: ['now', 'America/New_York'] }), {}, {}, now)
		).toBe(10);
		expect(
			evaluate(
				validateExpression({ op: 'day', args: [{ field: 'birthDate' }, 'UTC'] }),
				{ birthDate: '1970-11-01T00:00:00Z' },
				{}
			)
		).toBe(1);
		expect(evaluate(validateExpression({ op: 'divide', args: [1, 0] }), {}, {})).toBeNull();
	});
	it('caps fanout, preserves duplicate item identities, and validates saved graph positions', async () => {
		const base = blankWorkflow();
		base.nodes[0].config.rows = [
			{ id: 'same', name: 'a' },
			{ id: 'same', name: 'b' }
		];
		const result = await executeWorkflow(
			validateWorkflow(base),
			{},
			{ database: vi.fn(), api: vi.fn() }
		);
		expect(new Set(result.outputs.rows.map((row) => row._rowId)).size).toBe(2);
		base.nodes[0].position = { x: 300, y: 90 };
		expect(validateWorkflow(base).nodes[0].position).toEqual({ x: 300, y: 90 });
		base.nodes[0].position.x = Infinity;
		expect(() => validateWorkflow(base)).toThrow('positions');
	});
});
