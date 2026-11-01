import { defaultChart, type ChartDefinition } from '$lib/components/Chart/definition';
import type { SourceReference } from '$lib/data/types';
import type { BoundProperty } from '$lib/data/bindings';

export type ElementType =
	| 'text'
	| 'image'
	| 'svg'
	| 'rectangle'
	| 'ellipse'
	| 'line'
	| 'list'
	| 'repeater'
	| 'frame'
	| 'qr'
	| 'chart';
export type ElementPadding =
	| number
	| { mode: 'axis'; x: number; y: number }
	| { mode: 'sides'; top: number; right: number; bottom: number; left: number };
export type FrameDefinition = {
	layout: 'free' | 'row' | 'column' | 'grid';
	columns: number;
	gapMode?: 'uniform' | 'axis';
	columnGap: number;
	rowGap: number;
	justify: 'start' | 'center' | 'end' | 'space-between';
	align: 'start' | 'center' | 'end' | 'stretch';
	wrap: boolean;
	clip: boolean;
	elements: SlideElement[];
};
export const defaultFrame = (): FrameDefinition => ({
	layout: 'free',
	columns: 2,
	columnGap: 16,
	rowGap: 16,
	justify: 'start',
	align: 'start',
	wrap: false,
	clip: true,
	elements: []
});
export type SlideDataSource = {
	mode?: 'find' | 'aggregate';
	pipeline?: string;
	model: string;
	filter: string;
	select: string;
	sort: string;
	skip: number;
	limit: number;
	labelField: string;
	detailField: string;
	detailFormat: 'text' | 'date' | 'number';
	timeZone: string;
	emptyMessage: string;
};
export const defaultDataSource = (): SlideDataSource => ({
	mode: 'find',
	pipeline: '[]',
	model: '',
	filter: '{}',
	select: '',
	sort: '{}',
	skip: 0,
	limit: 5,
	labelField: '',
	detailField: '',
	detailFormat: 'text',
	timeZone: 'America/New_York',
	emptyMessage: 'No matching records.'
});
export type DataValue = string | number | boolean | null;
export type DataRow = {
	id: string;
	label: string;
	detail: string;
	fields?: Record<string, DataValue>;
};
export type DataBinding = { field: string; format: 'text' | 'date' | 'number'; fallback: string };
export type RepeatItems =
	| { mode: 'count'; count: number }
	| { mode: 'source'; source?: SourceReference };
export type RepeaterDefinition = {
	clip?: boolean;
	staggerMs?: number;
	columns: number;
	minItemWidth: number;
	itemHeight: number;
	columnGap: number;
	rowGap: number;
	align: 'start' | 'center' | 'end';
	overflow: 'paginate' | 'scroll' | 'clip';
	pageDurationMs: number;
	template: { width: number; height: number; elements: SlideElement[] };
};
export type DataListResult = {
	state: 'ready' | 'empty' | 'error';
	items: DataRow[];
	message: string;
};
export type SlideData = Record<string, DataListResult>;
export type SlideLayer = {
	durationMs?: number;
	definition: SlideDefinition;
	data: SlideData;
	assetUrls: Record<string, string>;
	timeMs: number;
	dataTimeMs: number;
};
export type ColorScheme = 'light' | 'dark';
export type DisplayMode = ColorScheme | 'system';
export type SlideColor = string | { light: string; dark: string };
export const defaultBorderColor: SlideColor = { light: '#111827', dark: '#f9fafb' };
export type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type HorizontalAnchor = 'scale' | 'left' | 'right' | 'center' | 'stretch';
export type VerticalAnchor = 'scale' | 'top' | 'bottom' | 'center' | 'stretch';
export type Pose = { x: number; y: number; opacity: number; scale: number; rotation: number };
export type Keyframe = Pose & { atMs: number; easing: Easing };
export type PlaylistTransition = { type: 'crossfade' | 'none'; durationMs: number };
export const defaultPlaylistTransition = (): PlaylistTransition => ({
	type: 'crossfade',
	durationMs: 2000
});
export type SlideElement = Pose & {
	id: string;
	type: ElementType;
	width: number;
	height: number;
	horizontalAnchor: HorizontalAnchor;
	verticalAnchor: VerticalAnchor;
	color: SlideColor;
	text: string;
	fontSize: number;
	fontFamily: 'sans-serif' | 'serif' | 'monospace';
	align: 'left' | 'center' | 'right';
	verticalAlign?: 'top' | 'middle' | 'bottom';
	assetId: string;
	fit: 'contain' | 'cover';
	imageOpacity?: number;
	keyframes: Keyframe[];
	chart?: ChartDefinition;
	dataSource?: SlideDataSource;
	dataReference?: SourceReference;
	repeatItems?: RepeatItems;
	dataTimeZone?: string;
	dataEmptyMessage?: string;
	bindings?: Partial<Record<BoundProperty, DataBinding>>;
	repeater?: RepeaterDefinition;
	binding?: DataBinding;
	fontWeight?: 400 | 600 | 700;
	borderRadius?: number;
	borderWidth?: number;
	borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
	borderColor?: SlideColor;
	backgroundColor?: SlideColor;
	padding?: ElementPadding;
	frame?: FrameDefinition;
	layoutSizing?: 'fixed' | 'fill';
	qrCorrection?: 'L' | 'M' | 'Q' | 'H';
	barcodeSymbology?: import('./barcodes').BarcodeSymbology;
};
export type RuleOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
export type VisibilityRule =
	| { kind: 'date'; operator: 'before' | 'on-or-before' | 'after' | 'on-or-after'; value: string }
	| { kind: 'weekdays'; days: number[] }
	| { kind: 'time'; start: string; end: string }
	| { kind: 'dataCount'; elementId: string; operator: RuleOperator; value: string }
	| { kind: 'dataValue'; elementId: string; field: string; operator: RuleOperator; value: string };
export type SlideVisibility = { match: 'all' | 'any'; timeZone: string; rules: VisibilityRule[] };
export type SlideDefinition = {
	schemaVersion: 1;
	width: number;
	height: number;
	background: SlideColor;
	durationMs: number;
	elements: SlideElement[];
	visibility?: SlideVisibility;
};
export type PlaylistItem = {
	slideId: string;
	durationMs: number | null;
	transition?: PlaylistTransition;
};
export type PlaylistDefinition = {
	transition?: PlaylistTransition;
	items: PlaylistItem[];
	loop: boolean;
	randomStart?: boolean;
	upcomingCount?: number;
};
export type SlideReference = {
	slug: string;
	title: string;
	draft: boolean;
	published: boolean;
};
export type PlaybackSlide = {
	transition?: PlaylistTransition;
	id: string;
	title: string;
	definition: SlideDefinition;
	durationMs: number;
	data?: SlideData;
};
export type Playback = {
	transition?: PlaylistTransition;
	version: string;
	title: string;
	loop: boolean;
	slides: PlaybackSlide[];
	randomStart?: boolean;
	upcomingCount?: number;
};
export type AssetSummary = {
	id: string;
	name: string;
	contentType: string;
	scope?: 'slide' | 'shared' | 'unassigned';
	slideId?: string;
};
export type ContentEditor<T> = {
	id: string;
	slug: string;
	title: string;
	version: number;
	publishedAt: string | null;
	draft: T;
};

export const blankSlide = (): SlideDefinition => ({
	schemaVersion: 1,
	width: 1920,
	height: 1080,
	background: { light: '#ffffff', dark: '#09090c' },
	durationMs: 10000,
	elements: []
});

export function newElement(type: ElementType, id: string): SlideElement {
	return {
		id,
		type,
		x: 160,
		y: 160,
		width: type === 'list' ? 1000 : 800,
		height: type === 'list' ? 540 : type === 'line' ? 8 : 240,
		horizontalAnchor: 'scale',
		verticalAnchor: 'scale',
		opacity: 1,
		scale: 1,
		rotation: 0,
		color: type === 'image' || type === 'svg' ? '#ffffff' : { light: '#111827', dark: '#f9fafb' },
		text: type === 'list' ? 'Data list' : 'Your text here',
		fontSize: type === 'list' ? 40 : 80,
		fontFamily: 'sans-serif',
		align: 'left',
		assetId: '',
		fit: type === 'image' || type === 'svg' ? 'cover' : 'contain',
		...(type === 'frame' ? { frame: defaultFrame(), text: 'Frame', color: 'transparent' } : {}),
		...(type === 'qr'
			? {
					width: 320,
					height: 320,
					text: 'https://example.com',
					color: '#000000',
					backgroundColor: '#ffffff',
					qrCorrection: 'M' as const
				}
			: {}),
		...(type === 'chart' ? { chart: defaultChart(), width: 1200, height: 650, text: 'Chart' } : {}),
		keyframes: [],
		...(type === 'list'
			? {
					dataSource: defaultDataSource()
				}
			: {})
	};
}
