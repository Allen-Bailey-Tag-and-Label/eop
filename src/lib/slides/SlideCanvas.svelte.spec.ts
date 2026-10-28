import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SlideCanvas from './SlideCanvas.svelte';
import { blankSlide, newElement } from './types';
import { resolveSlideColor } from './colors';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('responsive slide rendering', () => {
	it('renders resolved holiday rows and explicit empty/error states without hiding other elements', async () => {
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), elements: [newElement('list', 'calendar')] },
			assetBase: '/assets'
		});
		expect(view.getByText('Loading data…')).toBeInTheDocument();
		await view.rerender({
			data: {
				calendar: {
					state: 'ready',
					items: [{ id: '1', label: 'Thanksgiving', detail: 'Nov 26, 2026' }],
					message: ''
				}
			}
		});
		expect(view.getByText('Thanksgiving')).toBeInTheDocument();
		expect(view.getByText('Nov 26, 2026')).toBeInTheDocument();
		await view.rerender({ data: {} });
		expect(view.getByText('Loading data…')).toBeInTheDocument();
		await view.rerender({
			data: { calendar: { state: 'empty', items: [], message: 'No upcoming holidays.' } }
		});
		expect(view.getByText('No upcoming holidays.')).toBeInTheDocument();
		await view.rerender({
			data: {
				calendar: { state: 'error', items: [], message: 'Holiday data is temporarily unavailable.' }
			}
		});
		expect(view.getByText('Holiday data is temporarily unavailable.')).toBeInTheDocument();
		expect(view.getByText('Data list')).toBeInTheDocument();
	});
	it('holds element keyframes during entrance, plays them during display, and holds their final pose on exit', async () => {
		const element = newElement('text', 'headline');
		element.opacity = 0;
		element.keyframes = [{ ...element, atMs: 1000, opacity: 1, easing: 'linear' }];
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), elements: [element] },
			assetBase: '/assets',
			animateTransitions: true,
			timeMs: 1000
		});
		const box = () => view.getByText('Your text here').parentElement!;
		expect(box()).toHaveStyle({ opacity: '0' });
		await view.rerender({ timeMs: 2500 });
		expect(box()).toHaveStyle({ opacity: '0.5' });
		await view.rerender({ timeMs: 13000 });
		expect(box()).toHaveStyle({ opacity: '1' });
		expect(view.getByRole('img')).toHaveStyle({ opacity: '0.5' });
	});
	it('renders themed text, shapes, and backgrounds independently of the app theme while preserving fixed colors', async () => {
		const definition = {
			...blankSlide(),
			elements: [
				{
					...newElement('text', 'headline'),
					text: 'Themed text',
					color: { light: '#111111', dark: '#eeeeee' }
				},
				{ ...newElement('rectangle', 'shape'), color: { light: '#123456', dark: '#abcdef' } },
				{ ...newElement('text', 'brand'), text: 'Brand', color: '#ff0000' }
			]
		};
		const view = render(SlideCanvas, { definition, assetBase: '/assets', scheme: 'light' });
		expect(view.getByText('Themed text')).toHaveStyle({ color: '#111111' });
		expect(view.getByRole('img')).toHaveStyle({ background: '#ffffff' });
		expect(view.container.querySelector('div[style*="border-radius"]')).toHaveStyle({
			background: '#123456'
		});
		await view.rerender({ scheme: 'dark' });
		expect(view.getByText('Themed text')).toHaveStyle({ color: '#eeeeee' });
		expect(view.getByRole('img')).toHaveStyle({ background: '#09090c' });
		expect(view.container.querySelector('div[style*="border-radius"]')).toHaveStyle({
			background: '#abcdef'
		});
		expect(view.getByText('Brand')).toHaveStyle({ color: '#ff0000' });
	});
	it('fades the entire canvas including its background while static previews stay visible', async () => {
		const definition = { ...blankSlide(), elements: [newElement('text', 'headline')] };
		const view = render(SlideCanvas, { definition, assetBase: '/assets', timeMs: 0 });
		expect(view.getByRole('img')).toHaveStyle({ opacity: '1' });
		await view.rerender({ animateTransitions: true, timeMs: 1000 });
		expect(view.getByRole('img')).toHaveStyle({
			opacity: '0.5',
			background: resolveSlideColor(definition.background, 'dark')
		});
		await view.rerender({ timeMs: 14000 });
		expect(view.getByRole('img')).toHaveStyle({ opacity: '0' });
		await view.rerender({ includeExit: false });
		expect(view.getByRole('img')).toHaveStyle({ opacity: '1' });
	});
	it('fills the actual viewport and anchors a bottom-right element without letterboxing', () => {
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(2520);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(1080);
		const definition = {
			...blankSlide(),
			background: '#123456',
			elements: [
				{
					...newElement('text', 'headline'),
					text: 'Headline',
					x: 1700,
					y: 900,
					width: 120,
					height: 80,
					horizontalAnchor: 'right' as const,
					verticalAnchor: 'bottom' as const
				}
			]
		};
		const { getByRole, getByText } = render(SlideCanvas, { definition, assetBase: '/assets' });
		const viewport = getByRole('img', { name: 'Slide preview' });
		expect(viewport).toHaveStyle({ background: '#123456' });
		expect(viewport.firstElementChild).toHaveStyle({ width: '2520px', height: '1080px' });
		expect((getByText('Headline').parentElement as HTMLElement).style.transform).toContain(
			'translate(2300px,900px)'
		);
	});
	it('uses target-screen layout in a scaled editor preview, keeping text and images proportional', () => {
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1260);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540);
		const definition = {
			...blankSlide(),
			elements: [
				newElement('text', 'headline'),
				{ ...newElement('image', 'photo'), assetId: 'a'.repeat(24) }
			]
		};
		const { getByText, getByRole } = render(SlideCanvas, {
			definition,
			viewportWidth: 2520,
			viewportHeight: 1080,
			assetBase: '/assets'
		});
		expect(getByRole('img', { name: 'Slide preview' }).firstElementChild).toHaveStyle({
			width: '2520px',
			height: '1080px'
		});
		expect(getByText('Your text here', { selector: 'div' })).toHaveStyle({ fontSize: '80px' });
		expect(getByRole('img', { name: 'Your text here' })).toHaveStyle({ objectFit: 'contain' });
	});
});
