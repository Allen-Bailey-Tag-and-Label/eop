import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import CrossfadeStage from './CrossfadeStage.svelte';
import { blankSlide, newElement, type SlideLayer } from './types';

beforeEach(() =>
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	)
);
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
const layer = (text: string, background: string): SlideLayer => ({
	definition: { ...blankSlide(), background, elements: [{ ...newElement('text', text), text }] },
	data: {},
	assetUrls: {},
	timeMs: 0,
	dataTimeMs: 0
});

describe('playlist crossfade composition', () => {
	it('blends the incoming full canvas over an opaque outgoing surface without fading through the monitor background', async () => {
		const view = render(CrossfadeStage, {
			incoming: layer('New', '#000000'),
			outgoing: layer('Old', '#ffffff'),
			progress: 0.5,
			scheme: 'dark',
			assetBase: '/assets'
		});
		const incoming = view.container.querySelector('[data-playback-layer="incoming"]')!;
		const outgoing = view.container.querySelector('[data-playback-layer="outgoing"]')!;
		expect(incoming).toHaveStyle({ opacity: '0.5', background: '#09090c' });
		expect(outgoing).not.toHaveStyle({ opacity: '0.5' });
		expect(outgoing).toHaveAttribute('aria-hidden', 'true');
		expect(view.getByRole('img')).toHaveStyle({ background: '#000000' });
		expect(outgoing.querySelector('[role="img"]')).toHaveStyle({ background: '#ffffff' });
		await view.rerender({ incoming: layer('Transparent', 'transparent'), scheme: 'light' });
		expect(incoming).toHaveStyle({ background: '#ffffff', opacity: '0.5' });
		expect(view.getByRole('img')).toHaveStyle({ background: 'transparent' });
	});
});
