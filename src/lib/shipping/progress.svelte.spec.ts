import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import Detail from '../../routes/(private)/(padded)/shipping/quotes/[number]/+page.svelte';
import { advanceShippingQuote } from '../../routes/(private)/(padded)/shipping/quote/quote.remote';
import Results from './QuoteResults.svelte';
import { blankRequest, type QuoteView, type PricedRate } from './types';

vi.mock('../../routes/(private)/(padded)/shipping/quote/quote.remote', () => ({
	advanceShippingQuote: vi.fn()
}));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));

const advance = vi.mocked(advanceShippingQuote as (input: unknown) => Promise<QuoteView>);
const pending = (): QuoteView => {
	const request = { ...blankRequest('2026-11-12'), services: 'Both' as const };
	return {
		number: '1502',
		origin: 'shipping',
		createdAt: null,
		branchId: '',
		request,
		shipFrom: request.shipFrom,
		shipTo: request.shipTo,
		rates: [],
		attempts: [],
		legacyRates: [],
		generation: {
			validation: 'skipped',
			rates: 'pending',
			message: '',
			tasks: [
				{ service: 'UPS', label: 'Shipment', status: 'pending', message: '' },
				{ service: 'LTL', label: 'Shipment', status: 'pending', message: '' }
			]
		}
	};
};
const rate = (code: string, priceCents: number, description: string): PricedRate => ({
	service: 'UPS',
	provider: 'UPS',
	carrier: 'UPS',
	code,
	description,
	currency: 'USD',
	costCents: priceCents,
	priceCents,
	rateBasis: 'published',
	markup: { ruleId: null, label: '', revision: 0, percentBps: 0, amountCents: 0 }
});
async function flush() {
	await tick();
	await Promise.resolve();
	await tick();
}
beforeEach(() => {
	vi.clearAllMocks();
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
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('shipping quote progress and rate tables', () => {
	it('shows the quote immediately, polls in-flight progress, and displays partial rates before later requests finish', async () => {
		vi.useFakeTimers();
		const quote = pending();
		let release!: (quote: QuoteView) => void;
		advance.mockImplementation(async (input) => {
			if ((input as { poll?: boolean }).poll)
				return {
					...quote,
					generation: {
						...quote.generation!,
						tasks: quote.generation!.tasks.map((task, i) =>
							i === 0 ? { ...task, status: 'running' } : task
						)
					}
				};
			return new Promise((resolve) => {
				release = resolve;
			});
		});
		const view = render(Detail, { data: { quote } } as never);
		await flush();
		expect(view.getByRole('heading', { name: 'Quote 1502' })).toBeInTheDocument();
		expect(view.queryByText(/No rates were returned/)).not.toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(view.getByText('UPS - Shipment: running')).toBeInTheDocument();
		expect(advanceShippingQuote).toHaveBeenCalledWith({ quote: '1502', poll: true });
		const partial: QuoteView = {
			...quote,
			rates: [rate('03', 1250, 'Ground')],
			generation: {
				...quote.generation!,
				tasks: [{ ...quote.generation!.tasks[0], status: 'complete' }, quote.generation!.tasks[1]]
			}
		};
		release(partial);
		await flush();
		expect(view.getByText('1 of 2 rate requests finished')).toBeInTheDocument();
		expect(view.getByText('$12.50')).toBeInTheDocument();
		view.unmount();
		const calls = advance.mock.calls.length;
		release({ ...partial, generation: { ...partial.generation!, rates: 'complete' } });
		await vi.advanceTimersByTimeAsync(5000);
		expect(advanceShippingQuote).toHaveBeenCalledTimes(calls);
	});
	it('offers retry after a remote connection failure and resumes the same quote', async () => {
		const quote = pending();
		advance
			.mockRejectedValueOnce(new Error('Connection interrupted.'))
			.mockResolvedValue({ ...quote, generation: { ...quote.generation!, rates: 'complete' } });
		const view = render(Detail, { data: { quote } } as never);
		await flush();
		expect(view.getByText('Connection interrupted.')).toBeInTheDocument();
		await fireEvent.click(view.getByRole('button', { name: 'Retry' }));
		await flush();
		expect(advanceShippingQuote).toHaveBeenLastCalledWith({ quote: '1502', retry: true });
	});
	it('sorts services by numeric rate ascending and excludes internal pricing columns from details', async () => {
		const quote = pending();
		quote.generation = undefined;
		quote.rates = [rate('03', 10000, 'Expensive'), rate('02', 900, 'Cheap')];
		quote.attempts = [{ service: 'UPS', status: 'success', message: '' }];
		const view = render(Results, { quote });
		await flush();
		const rows = within(view.getByRole('table'))
			.getAllByRole('row')
			.filter((row) => row.querySelector('td') && row.textContent?.trim());
		expect(rows[0]).toHaveTextContent('UPS Cheap');
		expect(rows[1]).toHaveTextContent('UPS Expensive');
		await fireEvent.click(view.getByRole('button', { name: 'UPS shipment' }));
		const descending = within(view.getByRole('table'))
			.getAllByRole('row')
			.filter((row) => row.querySelector('td') && row.textContent?.trim());
		expect(descending[0]).toHaveTextContent('UPS Expensive');
		await fireEvent.click(view.getByRole('tab', { name: 'Rate details' }));
		await flush();
		for (const name of ['Carrier cost', 'Markup', 'Rate basis'])
			expect(view.queryByRole('columnheader', { name })).not.toBeInTheDocument();
		expect(view.getByRole('columnheader', { name: 'Customer price' })).toBeInTheDocument();
	});
});
