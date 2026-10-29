import { describe, expect, it } from 'vitest';
import { blankSlide, newElement } from './types';
import { validateSlide } from './validation';
import {
	frameAt,
	frameSlide,
	frameLayoutStyle,
	assetReferencePaths,
	reparentElement
} from './frames';
import { allElements, defaultRepeater } from './repeater';
import { mediaIds } from './media';
import { paddingSides, paddingCss } from './padding';

describe('frames and padding', () => {
	it('preserves static world transforms when moving through a padded rotated scaled frame', () => {
		const frame = { ...newElement('frame', 'frame'), rotation: 37, scale: 1.5, padding: 16 };
		const child = { ...newElement('text', 'child'), x: 300, y: 240, scale: 1.2, rotation: 20 };
		const original = structuredClone(child);
		reparentElement(child, frame, true);
		reparentElement(child, frame, false);
		for (const key of ['x', 'y', 'rotation', 'scale'] as const)
			expect(child[key]).toBeCloseTo(original[key]);
	});
	it('round-trips nested frames, template bindings and independent padding without losing legacy numeric padding', () => {
		const frame = newElement('frame', 'frame');
		frame.padding = { mode: 'axis', x: 12, y: 8 };
		frame.frame!.layout = 'grid';
		const child = newElement('text', 'label');
		child.padding = { mode: 'sides', top: 1, right: 2, bottom: 3, left: 4 };
		const nested = newElement('frame', 'nested');
		nested.frame!.elements = [child];
		frame.frame!.elements = [nested];
		const definition = { ...blankSlide(), elements: [frame] };
		expect(validateSlide(JSON.parse(JSON.stringify(definition)))).toEqual(definition);
		expect(frameAt(definition.elements, ['frame', 'nested'])).toBe(nested);
		expect(frameSlide(frame, 10000)).toMatchObject({ width: 776, height: 224, elements: [nested] });
		expect(paddingCss(12, 2)).toBe('24px 24px 24px 24px');
		expect(paddingSides({ mode: 'axis', x: 4, y: 8 })).toEqual({
			top: 8,
			right: 4,
			bottom: 8,
			left: 4
		});
		child.binding = { field: 'label', format: 'text', fallback: '' };
		expect(
			validateSlide(definition, true).elements[0].frame!.elements[0].frame!.elements[0].binding
		).toEqual(child.binding);
	});
	it('uses real CSS flex/grid layout with bounded options instead of accepting arbitrary styles', () => {
		const frame = newElement('frame', 'frame');
		frame.frame!.layout = 'row';
		frame.frame!.wrap = true;
		frame.frame!.columnGap = 10;
		expect(frameLayoutStyle(frame.frame, 2)).toContain(
			'display:flex;flex-direction:row;flex-wrap:wrap;column-gap:20px'
		);
		frame.frame!.layout = 'grid';
		frame.frame!.columns = 3;
		expect(frameLayoutStyle(frame.frame, 1)).toContain(
			'grid-template-columns:repeat(3,minmax(0,1fr))'
		);
		for (const changes of [
			{ layout: 'url(bad)' },
			{ columns: 0 },
			{ columns: 1.5 },
			{ rowGap: -1 },
			{ align: 'script()' },
			{ clip: 'yes' }
		]) {
			expect(() =>
				validateSlide({
					...blankSlide(),
					elements: [{ ...frame, frame: { ...frame.frame, ...changes } }]
				})
			).toThrow();
		}
		for (const padding of [
			-1,
			257,
			{ mode: 'axis', x: 1, y: -1 },
			{ mode: 'sides', top: 1, right: 2, bottom: 3 },
			{ mode: 'other' }
		])
			expect(() => validateSlide({ ...blankSlide(), elements: [{ ...frame, padding }] })).toThrow();
	});
	it('bounds nesting and finds media through frames and repeater templates', () => {
		const frame = newElement('frame', 'root'),
			nested = newElement('frame', 'nested'),
			list = newElement('list', 'list');
		list.repeater = defaultRepeater();
		list.repeater.template.elements = [nested];
		nested.frame!.elements = [{ ...newElement('image', 'photo'), assetId: 'a'.repeat(24) }];
		frame.frame!.elements = [list];
		expect(allElements({ elements: [frame] }).map((element) => element.id)).toEqual([
			'root',
			'list',
			'nested',
			'photo'
		]);
		expect(mediaIds({ ...blankSlide(), elements: [frame] })).toEqual(['a'.repeat(24)]);
		expect(assetReferencePaths('published.elements')).toContain(
			'published.elements.frame.elements.repeater.template.elements.frame.elements.assetId'
		);
		let current = frame;
		for (let i = 0; i < 10; i++) {
			const child = newElement('frame', `frame${i}`);
			current.frame!.elements = [child];
			current = child;
		}
		expect(() => validateSlide({ ...blankSlide(), elements: [frame] })).toThrow('nested');
	});
});
