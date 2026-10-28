import type { Keyframe, PlaylistDefinition, Pose, SlideDefinition, SlideElement } from './types';
import { defaultSlideTransition, type SlideTransition, type SlideDataSource } from './types';

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
	typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value)
		? value
		: invalid('Use a six-digit hex color.');
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
export function validateDataSource(input: unknown): SlideDataSource {
	const config = object(input);
	const daysAhead = number(config.daysAhead, 1, 365, 'Days ahead');
	const limit = number(config.limit, 1, 20, 'Maximum holidays');
	if (!Number.isInteger(daysAhead) || !Number.isInteger(limit))
		invalid('Use whole numbers for data source limits.');
	const timeZone = text(config.timeZone, 80, 'Time zone');
	try {
		new Intl.DateTimeFormat('en-US', { timeZone });
	} catch {
		invalid('Enter a valid time zone, such as America/New_York.');
	}
	return {
		source: choice(config.source, ['upcoming-holidays'], 'data source'),
		daysAhead,
		limit,
		timeZone
	};
}
export function validateSlide(input: unknown): SlideDefinition {
	const value = object(input);
	if (value.schemaVersion !== 1) invalid('Unsupported slide version.');
	const durationMs = number(value.durationMs, 1000, 600000, 'Duration in milliseconds');
	if (!Array.isArray(value.elements) || value.elements.length > 100)
		invalid('Use at most 100 elements.');
	const ids = new Set<string>();
	const elements = (value.elements as unknown[]).map((raw): SlideElement => {
		const e = object(raw);
		const id = text(e.id, 80, 'Element ID');
		if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id))
			invalid('Element IDs must be unique letters, numbers, or hyphens.');
		ids.add(id);
		const type = choice(
			e.type,
			['text', 'image', 'svg', 'rectangle', 'ellipse', 'line', 'list'],
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
			...(type === 'list' ? { dataSource: validateDataSource(e.dataSource) } : {}),
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
	if (elements.filter((element) => element.type === 'image' || element.type === 'svg').length > 20)
		invalid('Use at most 20 media elements per slide.');
	return {
		schemaVersion: 1,
		width: number(value.width, 320, 4096, 'Canvas width'),
		height: number(value.height, 240, 4096, 'Canvas height'),
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
