export type ElementType = 'text' | 'image' | 'svg' | 'rectangle' | 'ellipse' | 'line';
export type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type HorizontalAnchor = 'scale' | 'left' | 'right' | 'center' | 'stretch';
export type VerticalAnchor = 'scale' | 'top' | 'bottom' | 'center' | 'stretch';
export type Pose = { x: number; y: number; opacity: number; scale: number; rotation: number };
export type Keyframe = Pose & { atMs: number; easing: Easing };
export type SlideElement = Pose & {
	id: string;
	type: ElementType;
	width: number;
	height: number;
	horizontalAnchor: HorizontalAnchor;
	verticalAnchor: VerticalAnchor;
	color: string;
	text: string;
	fontSize: number;
	fontFamily: 'sans-serif' | 'serif' | 'monospace';
	align: 'left' | 'center' | 'right';
	assetId: string;
	fit: 'contain' | 'cover';
	keyframes: Keyframe[];
};
export type SlideDefinition = {
	schemaVersion: 1;
	width: number;
	height: number;
	background: string;
	durationMs: number;
	elements: SlideElement[];
};
export type PlaylistItem = { slideId: string; durationMs: number | null };
export type PlaylistDefinition = { items: PlaylistItem[]; loop: boolean };
export type PlaybackSlide = {
	id: string;
	title: string;
	definition: SlideDefinition;
	durationMs: number;
};
export type Playback = {
	version: string;
	title: string;
	loop: boolean;
	slides: PlaybackSlide[];
};
export type AssetSummary = { id: string; name: string; contentType: string };
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
	background: '#09090c',
	durationMs: 10000,
	elements: []
});

export function newElement(type: ElementType, id: string): SlideElement {
	return {
		id,
		type,
		x: 160,
		y: 160,
		width: 800,
		height: type === 'line' ? 8 : 240,
		horizontalAnchor: 'scale',
		verticalAnchor: 'scale',
		opacity: 1,
		scale: 1,
		rotation: 0,
		color: '#ffffff',
		text: 'Your text here',
		fontSize: 80,
		fontFamily: 'sans-serif',
		align: 'left',
		assetId: '',
		fit: 'contain',
		keyframes: []
	};
}
