import { describe, expect, it } from 'vitest';
import { blankSlide, newElement } from './types';
import { parseJson, slug, validatePlaylist, validateSlide } from './validation';
import { poseAt } from './timeline';

describe('slide definitions', () => {
	it('preserves vertical text alignment and rejects unsupported alignment values', () => {
		const element = newElement('text', 'text');
		for (const verticalAlign of ['top', 'middle', 'bottom']) {
			expect(
				validateSlide({ ...blankSlide(), elements: [{ ...element, verticalAlign }] }).elements[0]
					.verticalAlign
			).toBe(verticalAlign);
		}
		expect(
			validateSlide({ ...blankSlide(), elements: [element] }).elements[0].verticalAlign
		).toBeUndefined();
		expect(() =>
			validateSlide({ ...blankSlide(), elements: [{ ...element, verticalAlign: 'invalid' }] })
		).toThrow('vertical alignment');
	});
	it('preserves object decorations and rejects invalid or executable styles', () => {
		const element = {
			...newElement('text', 'box'),
			borderWidth: 4,
			borderStyle: 'dashed',
			borderColor: { light: '#111111', dark: '#eeeeee' },
			backgroundColor: { light: '#ffffff', dark: '#111827' },
			borderRadius: 24,
			padding: 12
		};
		expect(validateSlide({ ...blankSlide(), elements: [element] }).elements[0]).toMatchObject(
			element
		);
		for (const changes of [
			{ borderWidth: -1 },
			{ borderWidth: 129 },
			{ borderStyle: 'url(bad)' },
			{ borderColor: 'red' },
			{ backgroundColor: 'url(bad)' },
			{ borderRadius: 513 },
			{ padding: 257 }
		])
			expect(() =>
				validateSlide({ ...blankSlide(), elements: [{ ...element, ...changes }] })
			).toThrow();
		expect(
			validateSlide({ ...blankSlide(), elements: [{ ...element, backgroundColor: 'transparent' }] })
				.elements[0].backgroundColor
		).toBe('transparent');
	});
	it('accepts transparent backgrounds and element colors', () => {
		expect(validateSlide({ ...blankSlide(), background: 'transparent' }).background).toBe(
			'transparent'
		);
		expect(
			validateSlide({
				...blankSlide(),
				elements: [{ ...newElement('text', 'headline'), color: 'transparent' }]
			}).elements[0].color
		).toBe('transparent');
	});
	it('accepts typed elements and strips executable or unknown fields', () => {
		const element = {
			...newElement('text', 'headline'),
			text: '<script>alert(1)</script>',
			onclick: 'run()'
		};
		const slide = validateSlide({ ...blankSlide(), elements: [element], script: 'run()' });
		expect(slide).not.toHaveProperty('script');
		expect(slide.elements[0]).not.toHaveProperty('onclick');
		expect(slide.elements[0].text).toBe(element.text);
	});
	it('rejects invalid styles, media references, versions, and unbounded data', () => {
		for (const changes of [
			{ background: 'url(https://example.com)' },
			{ durationMs: Infinity },
			{ schemaVersion: 2 },
			{ elements: [newElement('image', 'image')] },
			{ elements: Array.from({ length: 101 }, (_, index) => newElement('text', `e${index}`)) }
		]) {
			expect(() => validateSlide({ ...blankSlide(), ...changes })).toThrow();
		}
		expect(() => parseJson('x'.repeat(250001))).toThrow();
		expect(() => parseJson(JSON.stringify('é'.repeat(130000)))).toThrow();
		for (const key of ['new', '../test', 'Uppercase', '<script>'])
			expect(() => slug(key)).toThrow();
	});
	it('rejects duplicate elements, repeated keyframe times, and frames beyond the duration', () => {
		const element = newElement('text', 'headline');
		expect(() => validateSlide({ ...blankSlide(), elements: [element, element] })).toThrow();
		const frame = { x: 0, y: 0, opacity: 1, rotation: 0, scale: 1, atMs: 1000, easing: 'linear' };
		for (const keyframes of [[frame, frame], [{ ...frame, atMs: 11000 }]])
			expect(() =>
				validateSlide({ ...blankSlide(), elements: [{ ...element, keyframes }] })
			).toThrow();
	});
	it('keeps playlist order, repeated slides, and duration overrides', () => {
		const items = [
			{ slideId: 'a'.repeat(24), durationMs: null },
			{ slideId: 'a'.repeat(24), durationMs: 5000 }
		];
		expect(validatePlaylist({ items, loop: true })).toEqual({ items, loop: true });
		expect(() => validatePlaylist({ items: [], loop: true })).toThrow();
		expect(() =>
			validatePlaylist({ items: [{ ...items[0], durationMs: -1 }], loop: true })
		).toThrow();
	});
});
describe('shared slide timeline', () => {
	it('interpolates from the base pose and holds the last frame', () => {
		const element = newElement('text', 'headline');
		element.x = 0;
		element.opacity = 0;
		element.keyframes = [
			{ x: 100, y: 160, opacity: 1, scale: 2, rotation: 90, atMs: 1000, easing: 'linear' }
		];
		expect(poseAt(element, 500)).toMatchObject({ x: 50, opacity: 0.5, scale: 1.5, rotation: 45 });
		expect(poseAt(element, 9000)).toMatchObject({ x: 100, opacity: 1, scale: 2 });
		expect(poseAt(element, -100)).toMatchObject({ x: 0, opacity: 0 });
	});
	it('supports a time-zero pose and easing into subsequent frames', () => {
		const element = newElement('text', 'headline');
		element.keyframes = [
			{ ...element, atMs: 0, x: 0, easing: 'linear' },
			{ ...element, x: 100, atMs: 1000, easing: 'ease-in' }
		];
		expect(poseAt(element, 500).x).toBe(25);
	});
});
