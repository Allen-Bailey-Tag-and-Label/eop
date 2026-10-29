import { safeField } from './data-link';
import { allElements } from './repeater';
import { normalizeDataSource, validateLink } from './data-link';
import type { Keyframe, PlaylistDefinition, Pose, SlideDefinition, SlideElement } from './types';
import type { ElementPadding, FrameDefinition } from './types';
import {
	defaultSlideTransition,
	type SlideTransition,
	type SlideDataSource,
	type RepeaterDefinition
} from './types';

export class SlideValidationError extends Error {}
const invalid = (message: string): never => {
	throw new SlideValidationError(message);
};
const object = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: invalid('Expected an object.');
const number = (value: unknown, min: number, max: number, label: string) =>
	typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
		? value
		: invalid(`${label} must be between ${min} and ${max}.`);
const text = (value: unknown, max: number, label: string) =>
	typeof value === 'string' && value.length <= max
		? value
		: invalid(`${label} is too long or missing.`);
const choice = <T extends string>(value: unknown, values: readonly T[], label: string): T =>
	values.includes(value as T) ? (value as T) : invalid(`Invalid ${label}.`);
const hexColor = (value: unknown) =>
	typeof value === 'string' &&
	(value === 'transparent' || /^#[a-f\d]{6}([a-f\d]{2})?$/i.test(value))
		? value
		: invalid('Use a six- or eight-digit hex color, or transparent.');
const color = (value: unknown) => {
	if (typeof value === 'string') return hexColor(value);
	const pair = object(value);
	return { light: hexColor(pair.light), dark: hexColor(pair.dark) };
};
export const isId = (value: unknown): value is string =>
	typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export function slug(value: unknown) {
	if (
		typeof value !== 'string' ||
		!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
		value.length > 80 ||
		value === 'new'
	)
		invalid('Use a slug of lowercase letters, numbers, and hyphens (except "new").');
	return value as string;
}
export function title(value: unknown) {
	const result = text(value, 160, 'Title').trim();
	return result || invalid('Enter a title.');
}
export function parseJson(value: unknown): unknown {
	if (typeof value !== 'string' || new TextEncoder().encode(value).byteLength > 250000)
		invalid('Definition must be JSON under 250 KB.');
	try {
		return JSON.parse(value as string);
	} catch {
		return invalid('Definition is not valid JSON.');
	}
}
function pose(value: Record<string, unknown>): Pose {
	return {
		x: number(value.x, -8192, 8192, 'X'),
		y: number(value.y, -8192, 8192, 'Y'),
		opacity: number(value.opacity, 0, 1, 'Opacity'),
		scale: number(value.scale, 0, 10, 'Scale'),
		rotation: number(value.rotation, -3600, 3600, 'Rotation')
	};
}
function transition(value: unknown): SlideTransition {
	if (value === undefined) return defaultSlideTransition();
	const settings = object(value);
	return {
		type: choice(settings.type, ['fade', 'none'], 'slide transition'),
		durationMs: number(settings.durationMs, 0, 600000, 'Transition duration in milliseconds')
	};
}
export function validateDataSource(input: unknown, requireLabel = true): SlideDataSource {
	try {
		const config = normalizeDataSource(input);
		validateLink(config, requireLabel);
		return config;
	} catch (cause) {
		return invalid(cause instanceof Error ? cause.message : 'Invalid data link.');
	}
}
function repeater(
	input: unknown,
	durationMs: number,
	depth: number,
	budget: { count: number }
): RepeaterDefinition {
	const value = object(input);
	const integer = (raw: unknown, min: number, max: number, label: string) => {
		const n = number(raw, min, max, label);
		if (!Number.isInteger(n)) invalid(`${label} must be a whole number.`);
		return n;
	};
	const template = object(value.template);
	if (value.clip !== undefined && typeof value.clip !== 'boolean')
		invalid('Repeater clip must be a boolean.');
	const validated = validateSlide(
		{
			schemaVersion: 1,
			width: template.width,
			height: template.height,
			durationMs,
			background: 'transparent',
			elements: template.elements
		},
		true,
		depth + 1,
		budget
	);
	return {
		columns: integer(value.columns, 0, 12, 'Columns'),
		minItemWidth: number(value.minItemWidth, 24, 4096, 'Minimum item width'),
		itemHeight: number(value.itemHeight, 0, 4096, 'Item height'),
		columnGap: number(value.columnGap, 0, 512, 'Column gap'),
		rowGap: number(value.rowGap, 0, 512, 'Row gap'),
		align: choice(value.align, ['start', 'center', 'end'], 'grid alignment'),
		overflow: choice(value.overflow, ['paginate', 'scroll', 'clip'], 'grid overflow'),
		pageDurationMs: integer(value.pageDurationMs, 500, 600000, 'Page duration'),
		...(value.staggerMs === undefined
			? {}
			: { staggerMs: integer(value.staggerMs, 0, 10000, 'Item stagger') }),
		...(value.clip === undefined ? {} : { clip: value.clip as boolean }),
		template: { width: validated.width, height: validated.height, elements: validated.elements }
	};
}
function padding(input: unknown): ElementPadding {
	if (typeof input === 'number') return number(input, 0, 256, 'Padding');
	const value = object(input);
	if (value.mode === 'axis')
		return {
			mode: 'axis',
			x: number(value.x, 0, 256, 'Horizontal padding'),
			y: number(value.y, 0, 256, 'Vertical padding')
		};
	if (value.mode !== 'sides') return invalid('Invalid padding mode.');
	return {
		mode: 'sides',
		top: number(value.top, 0, 256, 'Top padding'),
		right: number(value.right, 0, 256, 'Right padding'),
		bottom: number(value.bottom, 0, 256, 'Bottom padding'),
		left: number(value.left, 0, 256, 'Left padding')
	};
}
function validateFrame(
	input: unknown,
	width: unknown,
	height: unknown,
	durationMs: number,
	itemTemplate: boolean,
	depth: number,
	budget: { count: number }
): FrameDefinition {
	const frame = object(input);
	const integer = (value: unknown, min: number, max: number, label: string) => {
		const result = number(value, min, max, label);
		return Number.isInteger(result) ? result : invalid(`${label} must be an integer.`);
	};
	if (typeof frame.wrap !== 'boolean' || typeof frame.clip !== 'boolean')
		invalid('Frame wrap and clip must be booleans.');
	const children = validateSlide(
		{
			schemaVersion: 1,
			width,
			height,
			background: 'transparent',
			durationMs,
			elements: frame.elements
		},
		itemTemplate,
		depth + 1,
		budget
	);
	return {
		layout: choice(frame.layout, ['free', 'row', 'column', 'grid'], 'frame layout'),
		columns: integer(frame.columns, 1, 12, 'Frame columns'),
		...(frame.gapMode === undefined
			? {}
			: { gapMode: choice(frame.gapMode, ['uniform', 'axis'] as const, 'frame gap mode') }),
		columnGap: number(frame.columnGap, 0, 512, 'Column gap'),
		rowGap: number(frame.rowGap, 0, 512, 'Row gap'),
		justify: choice(
			frame.justify,
			['start', 'center', 'end', 'space-between'],
			'frame distribution'
		),
		align: choice(frame.align, ['start', 'center', 'end', 'stretch'], 'frame alignment'),
		wrap: frame.wrap as boolean,
		clip: frame.clip as boolean,
		elements: children.elements
	};
}
export function validateSlide(
	input: unknown,
	itemTemplate = false,
	depth = 0,
	budget = { count: 0 }
): SlideDefinition {
	if (depth > 8) invalid('Use at most eight nested frame/template levels.');
	const value = object(input);
	if (value.schemaVersion !== 1) invalid('Unsupported slide version.');
	const durationMs = number(value.durationMs, 1000, 600000, 'Duration in milliseconds');
	if (!Array.isArray(value.elements) || value.elements.length > 100)
		invalid('Use at most 100 elements.');
	const ids = new Set<string>();
	const elements = (value.elements as unknown[]).map((raw): SlideElement => {
		if (++budget.count > 500)
			invalid('Use at most 500 elements including frame and template contents.');
		const e = object(raw);
		const id = text(e.id, 80, 'Element ID');
		if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id))
			invalid('Element IDs must be unique letters, numbers, or hyphens.');
		ids.add(id);
		const type = choice(
			e.type,
			itemTemplate
				? ['text', 'image', 'svg', 'rectangle', 'ellipse', 'line', 'frame']
				: ['text', 'image', 'svg', 'rectangle', 'ellipse', 'line', 'list', 'frame'],
			'element type'
		);
		const assetId = text(e.assetId, 24, 'Asset ID').toLowerCase();
		if ((type === 'image' || type === 'svg') && !isId(assetId))
			invalid('Choose an uploaded asset for each image or SVG.');
		if (!Array.isArray(e.keyframes) || e.keyframes.length > 100)
			invalid('Use at most 100 keyframes per element.');
		let previous = -1;
		const keyframes = (e.keyframes as unknown[]).map((rawFrame): Keyframe => {
			const frame = object(rawFrame);
			const atMs = number(frame.atMs, 0, durationMs, 'Keyframe time');
			if (atMs <= previous) invalid('Keyframe times must increase without duplicates.');
			previous = atMs;
			return {
				...pose(frame),
				atMs,
				easing: choice(frame.easing, ['linear', 'ease-in', 'ease-out', 'ease-in-out'], 'easing')
			};
		});
		return {
			...pose(e),
			id,
			type,
			assetId,
			keyframes,
			...(type === 'list'
				? {
						dataSource: validateDataSource(e.dataSource, !e.repeater),
						...(e.repeater ? { repeater: repeater(e.repeater, durationMs, depth, budget) } : {})
					}
				: {}),
			...(itemTemplate && type === 'text' && e.binding
				? (() => {
						const binding = object(e.binding);
						const field = text(binding.field, 160, 'Binding field');
						if (
							!['label', 'detail', '$index'].includes(field) &&
							!(field.startsWith('row.') && safeField(field.slice(4)))
						)
							invalid('Choose a row field for this binding.');
						return {
							binding: {
								field,
								format: choice(binding.format, ['text', 'date', 'number'], 'binding format'),
								fallback: text(binding.fallback, 500, 'Binding fallback')
							}
						};
					})()
				: {}),
			...(e.fontWeight !== undefined
				? {
						fontWeight: [400, 600, 700].includes(e.fontWeight as number)
							? (e.fontWeight as 400 | 600 | 700)
							: invalid('Invalid font weight.')
					}
				: {}),
			...(e.padding !== undefined ? { padding: padding(e.padding) } : {}),
			...(type === 'frame'
				? {
						frame: validateFrame(
							e.frame,
							e.width,
							e.height,
							durationMs,
							itemTemplate,
							depth,
							budget
						)
					}
				: {}),
			...(e.layoutSizing !== undefined
				? { layoutSizing: choice(e.layoutSizing, ['fixed', 'fill'] as const, 'layout sizing') }
				: {}),
			...(e.verticalAlign !== undefined
				? {
						verticalAlign: choice(
							e.verticalAlign,
							['top', 'middle', 'bottom'] as const,
							'vertical alignment'
						)
					}
				: {}),
			...(e.borderWidth !== undefined
				? { borderWidth: number(e.borderWidth, 0, 128, 'Border width') }
				: {}),
			...(e.borderStyle !== undefined
				? {
						borderStyle: choice(
							e.borderStyle,
							['solid', 'dashed', 'dotted', 'double'] as const,
							'border style'
						)
					}
				: {}),
			...(e.borderColor !== undefined ? { borderColor: color(e.borderColor) } : {}),
			...(e.backgroundColor !== undefined
				? {
						backgroundColor:
							e.backgroundColor === 'transparent' ? 'transparent' : color(e.backgroundColor)
					}
				: {}),
			...(e.borderRadius !== undefined
				? { borderRadius: number(e.borderRadius, 0, 512, 'Corner radius') }
				: {}),
			horizontalAnchor:
				e.horizontalAnchor === undefined
					? 'scale'
					: choice(
							e.horizontalAnchor,
							['scale', 'left', 'right', 'center', 'stretch'],
							'horizontal anchor'
						),
			verticalAnchor:
				e.verticalAnchor === undefined
					? 'scale'
					: choice(
							e.verticalAnchor,
							['scale', 'top', 'bottom', 'center', 'stretch'],
							'vertical anchor'
						),
			width: number(e.width, 1, 8192, 'Width'),
			height: number(e.height, 1, 8192, 'Height'),
			color: color(e.color),
			text: text(e.text, 10000, 'Text'),
			fontSize: number(e.fontSize, 8, 500, 'Font size'),
			fontFamily: choice(e.fontFamily, ['sans-serif', 'serif', 'monospace'], 'font'),
			align: choice(e.align, ['left', 'center', 'right'], 'alignment'),
			fit: choice(e.fit, ['contain', 'cover'], 'image fit')
		};
	});
	const dataIds = allElements({ elements })
		.filter((element) => element.type === 'list')
		.map((element) => element.id);
	if (new Set(dataIds).size !== dataIds.length)
		invalid('Data elements need unique IDs across frames.');
	if (
		allElements({ elements }).filter(
			(element) => element.type === 'image' || element.type === 'svg'
		).length > 20
	)
		invalid('Use at most 20 media elements per slide.');
	return {
		schemaVersion: 1,
		width: number(
			value.width,
			itemTemplate || depth ? 1 : 320,
			depth ? 8192 : 4096,
			'Canvas width'
		),
		height: number(
			value.height,
			itemTemplate || depth ? 1 : 240,
			depth ? 8192 : 4096,
			'Canvas height'
		),
		background: value.background === 'transparent' ? 'transparent' : color(value.background),
		durationMs,
		transitionIn: transition(value.transitionIn),
		transitionOut: transition(value.transitionOut),
		elements
	};
}
export function validatePlaylist(input: unknown): PlaylistDefinition {
	const value = object(input);
	if (typeof value.loop !== 'boolean') invalid('Loop must be true or false.');
	if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 100)
		invalid('Add between 1 and 100 slides.');
	return {
		loop: value.loop as boolean,
		items: (value.items as unknown[]).map((raw) => {
			const item = object(raw);
			if (!isId(item.slideId)) invalid('Choose a slide for every playlist entry.');
			return {
				slideId: (item.slideId as string).toLowerCase(),
				durationMs:
					item.durationMs === null
						? null
						: number(item.durationMs, 1000, 600000, 'Duration override')
			};
		})
	};
}
