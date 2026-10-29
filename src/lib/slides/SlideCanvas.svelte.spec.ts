import { defaultRepeater } from './repeater';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SlideCanvas from './SlideCanvas.svelte';
import { blankSlide, newElement } from './types';
import { frameSlide } from './frames';

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
	for (const depth of [1, 3]) {
		it(`keeps heading and staggered repeater timing identical in root and frame previews at depth ${depth}`, async () => {
			const upcoming = { ...newElement('text', 'upcoming'), text: 'UPCOMING' };
			upcoming.keyframes = [
				{ ...upcoming, opacity: 0, atMs: 0, easing: 'linear' },
				{ ...upcoming, opacity: 1, atMs: 800, easing: 'linear' }
			];
			const holidays = { ...newElement('text', 'holidays'), text: 'HOLIDAYS' };
			holidays.keyframes = [
				{ ...holidays, opacity: 0, atMs: 0, easing: 'linear' },
				{ ...holidays, opacity: 0, atMs: 400, easing: 'linear' },
				{ ...holidays, opacity: 1, atMs: 1200, easing: 'linear' }
			];
			const settings = { ...defaultRepeater(), columns: 1, itemHeight: 100, staggerMs: 200 };
			const detail = { ...newElement('text', 'detail'), text: 'Detail' };
			detail.keyframes = [
				{ ...detail, opacity: 0, atMs: 0, easing: 'linear' },
				{ ...detail, opacity: 0, atMs: 1600, easing: 'linear' },
				{ ...detail, opacity: 1, atMs: 2400, easing: 'linear' }
			];
			settings.template.elements = [detail];
			const repeater = { ...newElement('list', 'grid'), height: 250, repeater: settings };
			const heading = newElement('frame', 'heading');
			heading.frame!.elements = [upcoming, holidays];
			let outer = newElement('frame', 'outer');
			outer.frame!.elements = [repeater, heading];
			for (let level = 1; level < depth; level++) {
				const parent = newElement('frame', `parent-${level}`);
				parent.frame!.elements = [outer];
				outer = parent;
			}
			const data = {
				grid: {
					state: 'ready' as const,
					message: '',
					items: Array.from({ length: 4 }, (_, index) => ({
						id: String(index),
						label: String(index),
						detail: ''
					}))
				}
			};
			const definition = { ...blankSlide(), durationMs: 56000, elements: [outer] };
			const view = render(SlideCanvas, {
				definition,
				assetBase: '/assets',
				timeMs: 0,
				data
			});
			const text = (id: string) => view.container.querySelector(`[data-slide-element="${id}"]`);
			const item = (number: number) =>
				view.container.querySelector(
					`[aria-label="Repeater item ${number}"] [data-slide-element="detail"]`
				);
			expect(text('upcoming')).toHaveStyle({ opacity: '0' });
			expect(item(1)).toHaveStyle({ opacity: '0' });
			await view.rerender({ timeMs: 400 });
			expect(text('upcoming')).toHaveStyle({ opacity: '0.5' });
			expect(text('holidays')).toHaveStyle({ opacity: '0' });
			expect(item(1)).toHaveStyle({ opacity: '0' });
			await view.rerender({ timeMs: 1600 });
			expect(text('holidays')).toHaveStyle({ opacity: '1' });
			expect(item(1)).toHaveStyle({ opacity: '0' });
			await view.rerender({ timeMs: 2000 });
			expect(item(1)).toHaveStyle({ opacity: '0.5' });
			expect(item(2)).toHaveStyle({ opacity: '0.25' });
			// Frame editing uses display time directly, without the root slide fade.
			await view.rerender({
				definition: frameSlide(outer, 56000),
				timeMs: 2000
			});
			expect(text('upcoming')).toHaveStyle({ opacity: '1' });
			expect(text('holidays')).toHaveStyle({ opacity: '1' });
			expect(item(1)).toHaveStyle({ opacity: '0.5' });
			expect(item(2)).toHaveStyle({ opacity: '0.25' });
			// During the root exit, data and element clocks both stop at display end.
			await view.rerender({ definition, timeMs: 56000 });
			expect(item(3)).toHaveStyle({ opacity: '1' });
			// A held final slide freezes headings but keeps paging, using the same time origin.
			await view.rerender({ timeMs: 56000, dataTimeMs: 60000 });
			expect(text('holidays')).toHaveStyle({ opacity: '1' });
			expect(item(1)).toHaveStyle({ opacity: '1' });
			await view.rerender({ dataTimeMs: 62000 });
			expect(item(1)).toHaveStyle({ opacity: '1' });
			expect(item(2)).toHaveStyle({ opacity: '1' });
		});
	}
	it('allows repeater overflow through the element, grid and item template while preserving legacy clipping', async () => {
		const settings = defaultRepeater();
		const element = { ...newElement('list', 'grid'), repeater: settings };
		const definition = { ...blankSlide(), elements: [element] };
		const view = render(SlideCanvas, {
			definition,
			assetBase: '/assets',
			data: {
				grid: { state: 'ready', message: '', items: [{ id: 'one', label: 'Item', detail: '' }] }
			}
		});
		const outer = () => view.container.querySelector('[data-slide-element="grid"]');
		expect(outer()).toHaveStyle({ overflow: 'hidden' });
		expect(view.getByLabelText('Repeater grid')).toHaveClass('overflow-hidden');
		expect(view.getByLabelText('Repeater item 1')).toHaveClass('overflow-hidden');
		await view.rerender({
			definition: {
				...definition,
				elements: [{ ...element, repeater: { ...settings, clip: false } }]
			}
		});
		expect(outer()).toHaveStyle({ overflow: 'visible' });
		expect(view.getByLabelText('Repeater grid')).toHaveClass('overflow-visible');
		expect(view.getByLabelText('Repeater item 1')).toHaveClass('overflow-visible');
		expect(view.getByLabelText('Repeater item 1').firstElementChild).toHaveStyle({
			overflow: 'visible'
		});
	});
	it('staggers each page on its first visit and holds final poses when pages cycle', async () => {
		const settings = { ...defaultRepeater(), staggerMs: 200 };
		const label = settings.template.elements[1];
		label.keyframes = [
			{ ...label, atMs: 0, opacity: 0, easing: 'linear' },
			{ ...label, atMs: 1000, opacity: 1, easing: 'linear' }
		];
		const element = { ...newElement('list', 'grid'), width: 1000, height: 400, repeater: settings };
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), width: 1000, height: 400, elements: [element] },
			assetBase: '/assets',
			timeMs: 100,
			data: {
				grid: {
					state: 'ready',
					message: '',
					items: Array.from({ length: 8 }, (_, index) => ({
						id: String(index),
						label: `Item ${index + 1}`,
						detail: ''
					}))
				}
			}
		});
		const item = (number: number) => view.getByLabelText(`Repeater item ${number}`);
		expect(item(2).parentElement).toHaveStyle({ visibility: 'hidden' });
		await view.rerender({ timeMs: 500 });
		expect(item(1).querySelector('[data-slide-element="label"]')).toHaveStyle({ opacity: '0.5' });
		expect(item(2).querySelector('[data-slide-element="label"]')).toHaveStyle({ opacity: '0.3' });
		await view.rerender({ timeMs: 5000 });
		expect(item(5).querySelector('[data-slide-element="label"]')).toHaveStyle({ opacity: '0' });
		expect(item(6).parentElement).toHaveStyle({ visibility: 'hidden' });
		await view.rerender({ timeMs: 10000 });
		expect(item(1).querySelector('[data-slide-element="label"]')).toHaveStyle({ opacity: '1' });
		expect(item(2).querySelector('[data-slide-element="label"]')).toHaveStyle({ opacity: '1' });
		// A single page must never restart its animation at the page interval either.
		await view.rerender({
			timeMs: 5000,
			data: {
				grid: {
					state: 'ready',
					message: '',
					items: [{ id: 'only', label: 'Only item', detail: '' }]
				}
			}
		});
		expect(item(1).querySelector('[data-slide-element="label"]')).toHaveStyle({ opacity: '1' });
	});
	it('renders nested frame content with CSS grid/flex layout and applies padding to images and frame content', async () => {
		const frame = {
			...newElement('frame', 'frame'),
			width: 800,
			height: 400,
			padding: { mode: 'axis' as const, x: 12, y: 8 },
			color: '#123456'
		};
		frame.frame!.layout = 'grid';
		frame.frame!.columns = 2;
		const child = {
			...newElement('text', 'bound'),
			text: 'Example',
			binding: { field: 'label', format: 'text' as const, fallback: '' }
		};
		const image = {
			...newElement('image', 'image'),
			assetId: 'a'.repeat(24),
			padding: { mode: 'sides' as const, top: 1, right: 2, bottom: 3, left: 4 }
		};
		frame.frame!.elements = [child, image];
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), elements: [frame] },
			assetBase: '/assets',
			row: { id: 'row', label: 'Bound nested text', detail: '' }
		});
		expect(view.getByText('Bound nested text')).toBeInTheDocument();
		const outer = view.container.querySelector('[data-slide-element="frame"]')!;
		expect(outer).toHaveStyle({ background: '#123456' });
		expect(outer.querySelector('[data-canvas-root]')).toHaveStyle({
			display: 'grid',
			gridTemplateColumns: 'repeat(2,minmax(0,1fr))'
		});
		expect(outer.firstElementChild).toHaveStyle({ inset: '8px 12px 8px 12px' });
		expect(
			view.container.querySelector('[data-slide-element="image"]')!.firstElementChild
		).toHaveStyle({ inset: '1px 2px 3px 4px' });
		frame.frame!.layout = 'row';
		await view.rerender({ definition: { ...blankSlide(), elements: [frame] } });
		expect(outer.querySelector('[data-canvas-root]')).toHaveStyle({
			display: 'flex',
			flexDirection: 'row'
		});
	});
	it('positions multiline text at the top, middle or bottom within its padded box', async () => {
		const element = {
			...newElement('text', 'aligned'),
			text: 'First line\nSecond line',
			padding: 12,
			align: 'right' as const
		};
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), elements: [element] },
			assetBase: '/assets'
		});
		const text = () => view.container.querySelector('[data-slide-element="aligned"] > div')!;
		expect(text()).toHaveStyle({
			display: 'grid',
			alignContent: 'start',
			padding: '12px',
			textAlign: 'right',
			whiteSpace: 'pre-wrap'
		});
		for (const [verticalAlign, alignContent] of [
			['middle', 'center'],
			['bottom', 'end'],
			['top', 'start']
		] as const) {
			await view.rerender({
				definition: { ...blankSlide(), elements: [{ ...element, verticalAlign }] }
			});
			expect(text()).toHaveStyle({ alignContent });
			expect(text().textContent).toBe('First line\nSecond line');
		}
	});
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
	it('renders bound item templates, preserves styling, and changes grid pages on the timeline', async () => {
		const settings = defaultRepeater();
		settings.template.elements[1].verticalAlign = 'middle';
		settings.template.elements[1].binding = {
			field: 'row.name',
			format: 'text',
			fallback: 'Missing'
		};
		settings.template.elements[2].binding = { field: 'row.date', format: 'date', fallback: '' };
		const grid = {
			...newElement('list', 'grid'),
			x: 0,
			y: 0,
			width: 1000,
			height: 400,
			repeater: settings
		};
		const rows = Array.from({ length: 5 }, (_, index) => ({
			id: String(index),
			label: '',
			detail: '',
			fields: { name: `Item ${index + 1}`, date: '2026-11-26T12:00:00Z' }
		}));
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), width: 1000, height: 400, elements: [grid] },
			viewportWidth: 1000,
			viewportHeight: 400,
			assetBase: '/assets',
			data: { grid: { state: 'ready', items: rows, message: '' } }
		});
		expect(view.getByText('Item 1')).toBeInTheDocument();
		expect(view.queryByText('Item 5')).not.toBeInTheDocument();
		expect(view.getByText('Item 1')).toHaveStyle({ fontWeight: '700' });
		expect(view.getByText('Item 1')).toHaveStyle({ alignContent: 'center' });
		expect(view.getAllByText('Nov 26, 2026')).toHaveLength(4);
		await view.rerender({ timeMs: 5000 });
		expect(view.getByText('Item 5')).toBeInTheDocument();
		expect(view.queryByText('Item 1')).not.toBeInTheDocument();
		await view.rerender({ timeMs: 0 });
		expect(view.getByText('Item 1')).toBeInTheDocument();
		await view.rerender({ timeMs: 7000 });
		expect(view.getByText('Item 5')).toBeInTheDocument();
		await view.rerender({ data: { grid: { state: 'empty', items: [], message: 'No rows' } } });
		expect(view.getByText('No rows')).toBeInTheDocument();
	});
	it('renders themed borders, rounded clipping, text backgrounds and padding without resizing objects', async () => {
		const text = {
			...newElement('text', 'text'),
			text: 'Styled',
			rotation: 30,
			borderWidth: 4,
			borderStyle: 'dashed' as const,
			borderColor: { light: '#123456', dark: '#abcdef' },
			backgroundColor: { light: '#ffffff', dark: '#111827' },
			borderRadius: 24,
			padding: 12
		};
		const image = {
			...newElement('image', 'image'),
			assetId: 'a'.repeat(24),
			borderRadius: 32,
			borderWidth: 2
		};
		const view = render(SlideCanvas, {
			definition: { ...blankSlide(), elements: [text, image] },
			assetBase: '/assets',
			scheme: 'light'
		});
		const frame = () => view.container.querySelector('[data-slide-element="text"]') as HTMLElement;
		expect(frame()).toHaveStyle({
			width: '800px',
			height: '240px',
			background: '#ffffff',
			borderRadius: '24px',
			overflow: 'hidden'
		});
		expect(frame().style.transform).toContain('rotate(30deg)');
		expect(view.getByText('Styled')).toHaveStyle({ padding: '12px' });
		expect(frame().lastElementChild).toHaveStyle({
			borderWidth: '4px',
			borderStyle: 'dashed',
			borderColor: '#123456',
			boxSizing: 'border-box'
		});
		expect(view.container.querySelector('[data-slide-element="image"]')).toHaveStyle({
			borderRadius: '32px',
			overflow: 'hidden'
		});
		await view.rerender({ scheme: 'dark' });
		expect(frame()).toHaveStyle({ background: '#111827' });
		expect(frame().lastElementChild).toHaveStyle({ borderColor: '#abcdef' });
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
