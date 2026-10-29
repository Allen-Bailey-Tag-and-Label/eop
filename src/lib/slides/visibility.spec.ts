import { describe, expect, it } from 'vitest';
import { slideIsVisible, validateVisibility } from './visibility';
import { blankSlide, defaultDataSource, newElement, type SlideVisibility } from './types';
import { validateSlide, validatePlaylist } from './validation';
const visibility = (
	rules: SlideVisibility['rules'],
	match: 'all' | 'any' = 'all'
): SlideVisibility => ({ timeZone: 'America/New_York', match, rules });
describe('slide visibility', () => {
	it('uses inclusive local calendar dates across midnight and preserves timezone rules', () => {
		const rules = visibility([{ kind: 'date', operator: 'on-or-before', value: '2026-10-29' }]);
		expect(validateVisibility(rules)).toEqual(rules);
		expect(slideIsVisible(rules, {}, new Date('2026-10-30T03:59:59Z'))).toBe(true);
		expect(slideIsVisible(rules, {}, new Date('2026-10-30T04:00:00Z'))).toBe(false);
		expect(slideIsVisible(undefined, {})).toBe(true);
	});
	it('combines weekdays and overnight time windows with all/any logic', () => {
		const rules = [
			{ kind: 'weekdays' as const, days: [4] },
			{ kind: 'time' as const, start: '22:00', end: '06:00' }
		];
		expect(slideIsVisible(visibility(rules), {}, new Date('2026-10-30T03:00:00Z'))).toBe(true);
		expect(slideIsVisible(visibility(rules), {}, new Date('2026-10-29T14:00:00Z'))).toBe(false);
		expect(slideIsVisible(visibility(rules, 'any'), {}, new Date('2026-10-29T14:00:00Z'))).toBe(
			true
		);
		expect(
			slideIsVisible(visibility([{ kind: 'time', start: '06:00', end: '06:00' }]), {}, new Date())
		).toBe(true);
	});
	it('checks returned row counts and primitive fields without matching missing fields or query errors', () => {
		const data = {
			metrics: {
				state: 'ready' as const,
				message: '',
				items: [{ id: 'one', label: 'Sales', detail: '', fields: { efficiency: 92, active: true } }]
			}
		};
		const count = {
			kind: 'dataCount' as const,
			elementId: 'metrics',
			operator: 'gt' as const,
			value: '0'
		};
		const field = {
			kind: 'dataValue' as const,
			elementId: 'metrics',
			field: 'row.efficiency',
			operator: 'gte' as const,
			value: '90'
		};
		expect(slideIsVisible(visibility([count, field]), data)).toBe(true);
		expect(slideIsVisible(visibility([{ ...field, operator: 'eq', value: '92.0' }]), data)).toBe(
			true
		);
		expect(
			slideIsVisible(
				visibility([{ ...field, field: 'row.active', operator: 'eq', value: 'true' }]),
				data
			)
		).toBe(true);
		expect(
			slideIsVisible(visibility([{ ...field, field: '__proto__', operator: 'neq' }]), data)
		).toBe(false);
		expect(
			slideIsVisible(visibility([count]), {
				metrics: { state: 'error', items: [], message: 'Unavailable' }
			})
		).toBe(false);
		expect(
			slideIsVisible(visibility([{ ...count, operator: 'eq', value: '0' }]), {
				metrics: { state: 'empty', items: [], message: '' }
			})
		).toBe(true);
	});
	it('validates bounded rules and rejects invalid dates, zones, operators and missing data links', () => {
		for (const rules of [
			{ ...visibility([]), rules: [] },
			{ ...visibility([{ kind: 'date', operator: 'before', value: '2026-02-30' }]) },
			{ ...visibility([{ kind: 'weekdays', days: [7] }]) },
			{ ...visibility([{ kind: 'time', start: '25:00', end: '08:00' }]) },
			{ ...visibility([{ kind: 'weekdays', days: [1] }]), timeZone: 'Invalid/Zone' },
			{ ...visibility([{ kind: 'dataCount', elementId: 'metrics', operator: 'gt', value: 'NaN' }]) }
		])
			expect(() => validateVisibility(rules)).toThrow();
		const link = {
			...newElement('list', 'metrics'),
			dataSource: { ...defaultDataSource(), model: 'Holiday', select: 'name', labelField: 'name' }
		};
		const slide = {
			...blankSlide(),
			elements: [link],
			visibility: visibility([
				{ kind: 'dataCount', elementId: 'metrics', operator: 'gt', value: '0' }
			])
		};
		expect(validateSlide(slide).visibility).toEqual(slide.visibility);
		expect(() => validateSlide({ ...slide, elements: [] })).toThrow('existing data element');
	});
	it('round-trips playlist options and rejects invalid preview counts and random flags', () => {
		const playlist = {
			transition: { type: 'crossfade', durationMs: 2000 },
			items: [{ slideId: 'a'.repeat(24), durationMs: null }],
			loop: false,
			randomStart: true,
			upcomingCount: 5
		};
		expect(validatePlaylist(playlist)).toEqual(playlist);
		for (const change of [
			{ upcomingCount: 0 },
			{ upcomingCount: 6 },
			{ upcomingCount: 1.5 },
			{ randomStart: 'true' }
		])
			expect(() => validatePlaylist({ ...playlist, ...change })).toThrow();
	});
});
