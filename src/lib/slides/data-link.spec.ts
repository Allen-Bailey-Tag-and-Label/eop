import { describe, expect, it } from 'vitest';
import { normalizeDataSource, parsePipeline, validateLink } from './data-link';
import { defaultDataSource } from './types';

describe('aggregation data links', () => {
	it('keeps saved find links compatible and persists aggregate configuration', () => {
		const old = { ...defaultDataSource(), model: 'Holiday', select: 'name', labelField: 'name' };
		delete old.mode;
		delete old.pipeline;
		expect(normalizeDataSource(old)).toMatchObject({ mode: 'find', pipeline: '[]' });
		const config = {
			...old,
			mode: 'aggregate' as const,
			model: 'User',
			pipeline: '[{"$match":{"isActive":true}}]'
		};
		expect(normalizeDataSource(config)).toMatchObject(config);
		expect(() => validateLink(config)).not.toThrow();
		expect(() => validateLink({ ...config, mode: 'find' })).toThrow('aggregate');
	});
	it('rejects writes, executable expressions, unrestricted sources, and nested lookup pipelines', () => {
		for (const stage of [
			{ $out: 'users' },
			{ $merge: 'users' },
			{ $unionWith: 'users' },
			{ $match: { $where: 'run()' } },
			{ $set: { data: { $function: { body: 'run()' } } } },
			{ $lookup: { from: 'UserPasswordReset', localField: '_id', foreignField: '_id', as: 'x' } },
			{
				$lookup: {
					from: 'UserProfile',
					localField: '_id',
					foreignField: '_id',
					as: 'x',
					pipeline: []
				}
			},
			{ $limit: 10001 },
			{ $skip: -1 },
			{ $sort: { name: 0 } },
			{ $match: {}, $limit: 1 }
		])
			expect(() => parsePipeline(JSON.stringify([stage]))).toThrow();
		expect(() => parsePipeline('[{"$project":{"__proto__":1}}]')).toThrow();
		expect(() => parsePipeline(JSON.stringify(Array(21).fill({ $match: {} })))).toThrow('20');
		expect(() => parsePipeline('{}')).toThrow('array');
		expect(() => parsePipeline(' '.repeat(20001))).toThrow('20 KB');
	});
});
