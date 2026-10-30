import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import ChartPlot from './ChartPlot.svelte';
import SlideChart from '$lib/slides/SlideChart.svelte';
import { chartKinds, defaultChart } from '../Chart/definition';
import { newElement } from '$lib/slides/types';
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	Object.defineProperty(SVGElement.prototype, 'getBBox', {
		configurable: true,
		value: () => ({ x: 0, y: 0, width: 50, height: 20 })
	});
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	delete (SVGElement.prototype as SVGElement & { getBBox?: unknown }).getBBox;
});
describe('LayerChart rendering', () => {
	it.each(chartKinds)('renders a real %s SVG with valid geometry', async (kind) => {
		const view = render(ChartPlot, {
			settings: { ...defaultChart(), kind },
			width: 800,
			height: 400,
			scheme: 'dark'
		});
		await waitFor(() => expect(view.container.querySelector('svg')).not.toBeNull());
		expect(view.queryByRole('alert')).not.toBeInTheDocument();
		const selector = {
			line: 'path.lc-path',
			bar: '.lc-bars-bar',
			area: '.lc-area-path',
			scatter: '.lc-point',
			pie: '.lc-arc-line',
			arc: '.lc-arc-line'
		}[kind];
		const marks = view.container.querySelectorAll(selector);
		expect(marks.length).toBeGreaterThan(0);
		expect(view.container.innerHTML).not.toMatch(/(?:NaN|Infinity)/);
	});
	it('does not replace empty or failed live sources with sample data', () => {
		const element = {
			...newElement('chart', 'live'),
			dataReference: { sourceId: 'a'.repeat(24), output: 'rows', parameters: {} }
		};
		const view = render(SlideChart, {
			element,
			data: { live: { state: 'error', items: [], message: 'Source unavailable' } },
			scheme: 'light',
			width: 800,
			height: 400
		});
		expect(view.getByRole('status')).toHaveTextContent('Source unavailable');
		expect(view.container.querySelector('svg')).toBeNull();
	});
	it('reports an empty chart when all values are invalid', () => {
		const view = render(ChartPlot, {
			settings: defaultChart(),
			data: [{ label: 'A', value: null }],
			width: 800,
			height: 400
		});
		expect(view.getByRole('status')).toHaveTextContent('No valid chart rows');
	});
});
