import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import SlideCanvas from './SlideCanvas.svelte';
import { blankSlide, newElement } from './types';

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
