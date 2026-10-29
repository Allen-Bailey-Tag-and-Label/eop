import { getDataFields } from './data-sources';
import { describe, expect, it } from 'vitest';
import { Slide, Playlist, Asset } from './models';
import * as genericModels from '../mongoose/models';

describe('slide model initialization', () => {
	it('exposes queryable business-model fields for the data-link editor', async () => {
		const fields = await getDataFields();
		expect(fields.Holiday).toEqual(expect.arrayContaining(['name', 'date']));
		expect(fields.Customer.length).toBeGreaterThan(0);
		expect(fields.UserProfile).toContain('firstName');
		expect(fields.User).toEqual(['_id', '_profileId', 'isActive']);
		expect(fields).not.toHaveProperty('UserPasswordReset');
	});
	it('registers models without connecting to MongoDB or exposing content through generic CRUD', () => {
		expect([Slide.modelName, Playlist.modelName, Asset.modelName]).toEqual([
			'MonitorSlide',
			'MonitorPlaylist',
			'MonitorAsset'
		]);
		expect(Object.values(genericModels)).not.toContain(Slide);
		expect(Object.values(genericModels)).not.toContain(Playlist);
		expect(Object.values(genericModels)).not.toContain(Asset);
		expect(Asset.schema.path('data').options.select).toBe(false);
	});
});
