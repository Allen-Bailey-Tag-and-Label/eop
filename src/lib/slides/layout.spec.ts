import { describe, expect, it } from 'vitest';
import {
	blankSlide,
	defaultDataSource,
	newElement,
	type HorizontalAnchor,
	type VerticalAnchor
} from './types';
import { defaultRepeater } from './repeater';
import { elementLayout, withResponsiveDefaults } from './layout';
import { poseAt } from './timeline';
import { moveElement, resizeElement } from './editor';
import { validateSlide } from './validation';

describe('responsive slide layout', () => {
	it('normalizes data links nested in frames and repeater templates without mutating saved data', () => {
		const pipeline = '[{"$match":{"isActive":true}}]';
		const list = newElement('list', 'birthdays');
		list.dataSource = {
			...defaultDataSource(),
			model: 'User',
			mode: 'aggregate',
			filter: pipeline
		};
		delete list.dataSource.pipeline;
		const frame = newElement('frame', 'frame');
		frame.frame!.elements = [list];
		const outer = newElement('list', 'outer');
		outer.repeater = defaultRepeater();
		outer.repeater.template.elements = [structuredClone(list)];
		const result = withResponsiveDefaults({ ...blankSlide(), elements: [frame, outer] });
		expect(result.elements[0].frame!.elements[0].dataSource).toMatchObject({
			pipeline,
			filter: '{}'
		});
		expect(result.elements[1].repeater!.template.elements[0].dataSource).toMatchObject({
			pipeline,
			filter: '{}'
		});
		expect(list.dataSource).not.toHaveProperty('pipeline');
		expect(list.dataSource.filter).toBe(pipeline);
	});
	it('preserves the reference design for every anchor combination', () => {
		const definition = blankSlide();
		const element = newElement('text', 'headline');
		for (const horizontalAnchor of [
			'scale',
			'left',
			'right',
			'center',
			'stretch'
		] as HorizontalAnchor[]) {
			for (const verticalAnchor of [
				'scale',
				'top',
				'bottom',
				'center',
				'stretch'
			] as VerticalAnchor[]) {
				Object.assign(element, { horizontalAnchor, verticalAnchor });
				expect(elementLayout(definition, element, element, 1920, 1080)).toMatchObject({
					x: 160,
					y: 160,
					width: 800,
					height: 240,
					fontSize: 80
				});
			}
		}
	});
	it('uses the whole wide or portrait viewport with proportional boxes and undistorted text', () => {
		const definition = blankSlide();
		const element = newElement('text', 'headline');
		expect(elementLayout(definition, element, element, 3840, 2160)).toMatchObject({
			x: 320,
			y: 320,
			width: 1600,
			height: 480,
			fontSize: 160
		});
		expect(elementLayout(definition, element, element, 1080, 1920)).toMatchObject({
			x: 90,
			y: (160 * 1920) / 1080,
			width: 450,
			fontSize: 45
		});
	});
	it('keeps right, bottom, and center offsets when the screen changes shape', () => {
		const definition = blankSlide();
		const element = {
			...newElement('image', 'logo'),
			x: 1700,
			y: 900,
			width: 120,
			height: 80,
			horizontalAnchor: 'right' as const,
			verticalAnchor: 'bottom' as const
		};
		const box = elementLayout(definition, element, element, 2520, 1200);
		const unit = 1200 / 1080;
		expect(2520 - box.x - box.width).toBeCloseTo(100 * unit);
		expect(1200 - box.y - box.height).toBeCloseTo(100 * unit);
		Object.assign(element, {
			x: 900,
			y: 500,
			horizontalAnchor: 'center',
			verticalAnchor: 'center'
		});
		const centered = elementLayout(definition, element, element, 2520, 1200);
		expect(centered.x + centered.width / 2).toBeCloseTo(1260);
		expect(centered.y + centered.height / 2).toBeCloseTo(600);
	});
	it('stretches a box between opposite margins instead of stretching its text', () => {
		const definition = blankSlide();
		const element = {
			...newElement('text', 'banner'),
			x: 100,
			width: 1720,
			horizontalAnchor: 'stretch' as const,
			verticalAnchor: 'top' as const
		};
		const box = elementLayout(definition, element, element, 2520, 1080);
		expect(box).toMatchObject({ x: 100, width: 2320, fontSize: 80 });
		expect(2520 - box.x - box.width).toBe(100);
	});
	it('applies animation poses through the same anchor rules and preserves editing in reference units', () => {
		const definition = blankSlide();
		const element = { ...newElement('text', 'headline'), horizontalAnchor: 'right' as const };
		element.keyframes = [{ ...element, x: 260, atMs: 1000, easing: 'linear' }];
		const before = elementLayout(definition, element, poseAt(element, 500), 2520, 1080);
		moveElement(element, 10 / before.positionScaleX, 0);
		const after = elementLayout(definition, element, poseAt(element, 500), 2520, 1080);
		expect(after.x - before.x).toBeCloseTo(10);
		expect(element.keyframes[0].x).toBe(270);
	});
	it('keeps the opposite corner fixed when resizing a rotated, mixed-anchor box', () => {
		const definition = blankSlide();
		const element = {
			...newElement('rectangle', 'shape'),
			rotation: 30,
			scale: 1.5,
			horizontalAnchor: 'scale' as const,
			verticalAnchor: 'bottom' as const
		};
		const corner = () => {
			const box = elementLayout(definition, element, element, 2520, 1080);
			const angle = Math.PI / 6;
			return {
				x:
					box.x +
					box.width / 2 -
					(element.scale * (box.width * Math.cos(angle) - box.height * Math.sin(angle))) / 2,
				y:
					box.y +
					box.height / 2 -
					(element.scale * (box.width * Math.sin(angle) + box.height * Math.cos(angle))) / 2
			};
		};
		const before = corner();
		resizeElement(
			element,
			{ width: 900, height: 280 },
			element.rotation,
			element.scale,
			elementLayout(definition, element, element, 2520, 1080)
		);
		expect(corner().x).toBeCloseTo(before.x);
		expect(corner().y).toBeCloseTo(before.y);
	});
	it('defaults old JSON definitions without mutating them and rejects invalid constraints', () => {
		const definition = { ...blankSlide(), elements: [newElement('text', 'headline')] };
		const legacy = JSON.parse(JSON.stringify(definition));
		delete legacy.elements[0].horizontalAnchor;
		delete legacy.elements[0].verticalAnchor;
		expect(withResponsiveDefaults(legacy)).toEqual(definition);
		expect(legacy.elements[0]).not.toHaveProperty('horizontalAnchor');
		expect(validateSlide(legacy)).toEqual(definition);
		expect(elementLayout(legacy, legacy.elements[0], legacy.elements[0], 2520, 1080).width).toBe(
			1050
		);
		legacy.elements[0].horizontalAnchor = 'bottom';
		expect(() => validateSlide(legacy)).toThrow('horizontal anchor');
	});
});
