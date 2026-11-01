import { describe, expect, it } from 'vitest';
import { blankSlide, newElement } from './types';
import { shapeVertices } from './shapes';
import { validateSlide } from './validation';

describe('slide shape primitives', () => {
	it('fits polygon and star vertices to resized bounds and keeps stroke inset', () => {
		for (const type of ['polygon', 'star'] as const) {
			const element = { ...newElement(type, type), shapePoints: 7 };
			const vertices = shapeVertices(element, 400, 200, 4)
				.split(' ')
				.map((point) => point.split(',').map(Number));
			expect(vertices).toHaveLength(type === 'star' ? 14 : 7);
			expect(Math.min(...vertices.map(([x]) => x))).toBeCloseTo(4);
			expect(Math.max(...vertices.map(([x]) => x))).toBeCloseTo(396);
			expect(Math.min(...vertices.map(([, y]) => y))).toBeCloseTo(4);
			expect(Math.max(...vertices.map(([, y]) => y))).toBeCloseTo(196);
		}
	});
	it('supports independent arrowheads without extending beyond the element', () => {
		for (const arrowHeads of ['start', 'end', 'both', 'none'] as const) {
			const element = { ...newElement('arrow', 'arrow'), arrowHeads };
			const vertices = shapeVertices(element, 400, 100)
				.split(' ')
				.map((point) => point.split(',').map(Number));
			expect(vertices).toHaveLength(arrowHeads === 'both' ? 10 : arrowHeads === 'none' ? 4 : 7);
			expect(vertices.every(([x, y]) => x >= 0 && x <= 400 && y >= 0 && y <= 100)).toBe(true);
		}
	});
	it('round trips editable shapes inside frames and repeater templates', () => {
		const shapes = ['arrow', 'polygon', 'star'].map((type, index) =>
			newElement(type as 'arrow' | 'polygon' | 'star', `shape-${index}`)
		);
		const frame = newElement('frame', 'frame');
		frame.frame!.elements = shapes;
		const slide = { ...blankSlide(), elements: [frame] };
		expect(validateSlide(JSON.parse(JSON.stringify(slide))).elements[0].frame!.elements).toEqual(
			shapes
		);
		for (const element of shapes)
			expect(validateSlide({ ...blankSlide(), elements: [element] }, true).elements[0]).toEqual(
				element
			);
	});
	it('rejects invalid point counts, star inset, arrow width and endpoints', () => {
		for (const shapePoints of [2, 3.5, 61])
			expect(() =>
				validateSlide({
					...blankSlide(),
					elements: [{ ...newElement('polygon', 'shape'), shapePoints }]
				})
			).toThrow();
		for (const starInnerRatio of [0, 1])
			expect(() =>
				validateSlide({
					...blankSlide(),
					elements: [{ ...newElement('star', 'shape'), starInnerRatio }]
				})
			).toThrow();
		for (const arrowWeight of [0, 129])
			expect(() =>
				validateSlide({
					...blankSlide(),
					elements: [{ ...newElement('arrow', 'shape'), arrowWeight }]
				})
			).toThrow();
		expect(() =>
			validateSlide({
				...blankSlide(),
				elements: [{ ...newElement('arrow', 'shape'), arrowHeads: 'invalid' }]
			})
		).toThrow();
	});
});
