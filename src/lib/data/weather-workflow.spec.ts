import { describe, expect, it, vi } from 'vitest';
import raw from '../../../weather-14423-workflow.json';
import { executeWorkflow, validateWorkflow } from './workflows';

describe('Caledonia seven-day forecast workflow', () => {
	it('turns fourteen day/night periods into seven unique daily rows with highs and lows', async () => {
		const periods = Array.from({ length: 7 }, (_, index) => {
			const date = new Date(Date.UTC(2026, 9, 30 + index)).toISOString().slice(0, 10);
			return [true, false].map((isDaytime, part) => ({
				number: index * 2 + part + 1,
				day: `Day ${index + 1}${isDaytime ? '' : ' Night'}`,
				startTime: `${date}T${isDaytime ? '08' : '18'}:00:00-04:00`,
				isDaytime,
				temperature: (isDaytime ? 60 : 40) + index,
				unit: 'F',
				condition: 'Mostly Cloudy',
				windSpeed: '5 mph',
				windDirection: 'W',
				precipitationChance: 20
			}));
		}).flat();
		const api = vi.fn(async () => periods);
		const result = await executeWorkflow(validateWorkflow(raw), {}, { api, database: vi.fn() });
		expect(api).toHaveBeenCalledOnce();
		expect(result.outputs.forecast).toHaveLength(7);
		expect(new Set(result.outputs.forecast.map((row) => row.id)).size).toBe(7);
		expect(result.outputs.forecast[0]).toMatchObject({
			high: 60,
			low: 40,
			temperatureText: '60°F / 40°F',
			condition: 'Mostly Cloudy'
		});
		expect(result.outputs.forecast[6]).toMatchObject({ high: 66, low: 46 });
	});
	it('matches the following night instead of an early overnight period and leaves unavailable lows empty', async () => {
		const periods = [
			{
				number: 1,
				day: 'Overnight',
				startTime: '2026-10-30T01:00:00-04:00',
				isDaytime: false,
				temperature: 30
			},
			{
				number: 2,
				day: 'Today',
				startTime: '2026-10-30T08:00:00-04:00',
				isDaytime: true,
				temperature: 55
			},
			{
				number: 3,
				day: 'Tonight',
				startTime: '2026-10-30T18:00:00-04:00',
				isDaytime: false,
				temperature: 40
			},
			{
				number: 4,
				day: 'Saturday',
				startTime: '2026-10-31T08:00:00-04:00',
				isDaytime: true,
				temperature: 60
			}
		].map((period) => ({ ...period, unit: 'F' }));
		const result = await executeWorkflow(
			validateWorkflow(raw),
			{},
			{ api: async () => periods, database: vi.fn() }
		);
		expect(result.outputs.forecast[0].low).toBe(40);
		expect(result.outputs.forecast[1]).toMatchObject({
			high: 60,
			low: null,
			temperatureText: '60°F / —'
		});
	});
});
