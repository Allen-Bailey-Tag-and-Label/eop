import { describe, expect, it, vi } from 'vitest';
import { Schema, type Model } from 'mongoose';
import { buildDataPipeline, createSlideDataResolver } from './data-sources';
import { blankSlide, defaultDataSource, newElement } from '$lib/slides/types';
import { defaultRepeater } from '$lib/slides/repeater';

vi.mock('../mongoose/models', async () => {
	const { Schema } = await import('mongoose');
	return {
		User: {
			schema: new Schema({
				isActive: Boolean,
				_profileId: Schema.Types.ObjectId,
				passwordHash: String
			}),
			aggregate: vi.fn()
		}
	};
});
import { User } from '../mongoose/models';

const config = () => ({
	...defaultDataSource(),
	mode: 'aggregate' as const,
	model: 'User',
	select: 'displayText birthdayDay',
	sort: '{"birthdayDay":1}',
	pipeline: JSON.stringify([
		{ $match: { isActive: true } },
		{
			$lookup: { from: 'UserProfile', localField: '_profileId', foreignField: '_id', as: 'profile' }
		},
		{ $unwind: '$profile' },
		{
			$project: {
				displayText: '$profile.firstName',
				birthdayDay: { $dayOfMonth: '$profile.birthDate' }
			}
		}
	])
});
const models = {
	User: {
		schema: new Schema({
			isActive: Boolean,
			_profileId: Schema.Types.ObjectId,
			passwordHash: String,
			username: String,
			settings: Object
		})
	},
	UserProfile: {
		collection: { name: 'actual_profiles' },
		schema: new Schema({
			firstName: String,
			birthDate: Date,
			secret: String,
			hidden: { type: String, select: false },
			metadata: Object,
			nested: { public: String, token: String },
			items: [{ password: String }]
		})
	}
} as unknown as Record<string, Model<Record<string, unknown>>>;

describe('server aggregation execution', () => {
	it('strips sensitive input, translates model joins, and bounds selected output after filtering', () => {
		const stages = buildDataPipeline(config(), models, new Date());
		expect(stages[0]).toEqual({ $project: { _id: 1, isActive: 1, _profileId: 1 } });
		expect(stages[2]).toEqual({
			$lookup: {
				from: 'actual_profiles',
				localField: '_profileId',
				foreignField: '_id',
				as: 'profile',
				pipeline: [{ $project: { _id: 1, firstName: 1, birthDate: 1, 'nested.public': 1 } }]
			}
		});
		expect(stages.slice(-4)).toEqual([
			{ $sort: { birthdayDay: 1, _id: 1 } },
			{ $skip: 0 },
			{ $limit: 5 },
			{ $project: { _id: 1, displayText: 1, birthdayDay: 1 } }
		]);
		expect(JSON.stringify(stages)).not.toMatch(
			/password|secret|hidden|metadata|items|token|username/
		);
	});
	it('rejects joins on hidden fields and preserves pipeline sort when outer sort is empty', () => {
		const value = config();
		value.pipeline =
			'[{"$lookup":{"from":"UserProfile","localField":"_profileId","foreignField":"hidden","as":"profile"}}]';
		expect(() => buildDataPipeline(value, models, new Date())).toThrow('Unavailable lookup');
		value.pipeline = '[{"$sort":{"birthdayDay":1}}]';
		value.sort = '{}';
		expect(
			buildDataPipeline(value, models, new Date()).filter((stage) => '$sort' in stage)
		).toEqual([{ $sort: { birthdayDay: 1 } }]);
	});
	it('executes bounded aggregates and sends only configured primitive fields to repeaters', async () => {
		const exec = vi
			.fn()
			.mockResolvedValue([
				{ _id: 'one', displayText: 'Employee — March 5', birthdayDay: 5, passwordHash: 'private' }
			]);
		const option = vi.fn().mockReturnValue({ exec });
		vi.mocked(User.aggregate).mockReturnValue({ option } as unknown as ReturnType<
			typeof User.aggregate
		>);
		const definition = {
			...blankSlide(),
			elements: [
				{
					...newElement('list', 'birthdays'),
					repeater: defaultRepeater(),
					dataSource: { ...config(), pipeline: '[]' }
				}
			]
		};
		const result = await createSlideDataResolver(new Date(), true)(definition);
		expect(result.birthdays.state).toBe('ready');
		expect(result.birthdays.items[0].fields).toEqual({
			displayText: 'Employee — March 5',
			birthdayDay: 5
		});
		expect(JSON.stringify(result)).not.toContain('private');
		expect(option).toHaveBeenCalledWith({ maxTimeMS: 4000, allowDiskUse: false });
		await createSlideDataResolver()(definition);
		expect(User.aggregate).toHaveBeenCalledTimes(2);
	});
});
