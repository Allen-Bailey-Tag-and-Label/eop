import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { goto } from '$app/navigation';
import Create from '../../routes/(private)/(padded)/ups/quote/+page.svelte';
import Detail from '../../routes/(private)/(padded)/ups/quote/[quote]/+page.svelte';
import {
	createUpsQuote,
	advanceUpsQuote
} from '../../routes/(private)/(padded)/ups/quote/quote.remote';
import type { UpsQuoteView } from './quote';
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	slide: () => ({ duration: 0 })
}));
vi.mock('../../routes/(private)/(padded)/ups/quote/quote.remote', () => ({
	createUpsQuote: vi.fn(),
	advanceUpsQuote: vi.fn()
}));
function quote(): UpsQuoteView {
	const address = {
		AddressLine: '1 Main St',
		City: 'Caledonia',
		StateProvinceCode: 'NY',
		PostalCode: '14423',
		CountryCode: 'US'
	};
	return {
		quote: 1234,
		_branchId: 'b'.repeat(24),
		createdAt: '2026-11-11T12:00:00Z',
		classification: 'Unknown',
		isValidated: false,
		packageTotalCount: 2,
		packageTotalWeight: 21,
		packageWeight: 11,
		shipper: address,
		shipTo: address,
		rates: [],
		generation: { validation: 'pending', rates: 'pending' }
	};
}
function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
async function flush() {
	await tick();
	await Promise.resolve();
	await tick();
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());
describe('UPS quote feedback', () => {
	it('reuses a submission ID for connection retries and creates a new ID after the inputs change', async () => {
		vi.mocked(createUpsQuote).mockRejectedValue(new Error('Connection interrupted'));
		const view = render(Create, {
			data: {
				locals: { user: { branches: [{ _id: 'b'.repeat(24), number: 2046 }] } },
				_branchId: '',
				isValidated: 'true',
				formData: {
					shipFrom: { address: '3177 Lehigh', city: 'Caledonia', state: 'NY', zip: '14423' },
					shipTo: { address: '1 Main', city: 'Caledonia', state: 'NY', zip: '14423' },
					packageInfo: { totalPackages: '2', totalWeight: '21' }
				}
			}
		} as never);
		await flush();
		const form = view.getByRole('button', { name: 'Get Quote' }).closest('form')!;
		await fireEvent.submit(form);
		await flush();
		await fireEvent.submit(form);
		await flush();
		const first = vi.mocked(createUpsQuote).mock.calls[0][0] as { requestId: string };
		const second = vi.mocked(createUpsQuote).mock.calls[1][0] as { requestId: string };
		expect(second.requestId).toBe(first.requestId);
		await fireEvent.input(form.querySelector('[name="shipToAddress"]')!, {
			target: { value: '2 Main' }
		});
		await fireEvent.submit(form);
		await flush();
		const third = vi.mocked(createUpsQuote).mock.calls[2][0] as { requestId: string };
		expect(third.requestId).not.toBe(first.requestId);
	});
	it('navigates as soon as the pending quote exists, without requesting validation or rates on the input page', async () => {
		const pending = deferred<number>();
		vi.mocked(createUpsQuote).mockReturnValue(pending.promise as never);
		const view = render(Create, {
			data: {
				locals: { user: { branches: [{ _id: 'b'.repeat(24), number: 2046 }] } },
				_branchId: '',
				isValidated: 'true',
				formData: {
					shipFrom: { address: '3177 Lehigh', city: 'Caledonia', state: 'NY', zip: '14423' },
					shipTo: { address: '1 Main', city: 'Caledonia', state: 'NY', zip: '14423' },
					packageInfo: { totalPackages: '2', totalWeight: '21' }
				}
			}
		} as never);
		await flush();
		await fireEvent.submit(view.getByRole('button', { name: 'Get Quote' }).closest('form')!);
		expect(createUpsQuote).toHaveBeenCalledWith(
			expect.objectContaining({
				packageInfoTotalPackages: '2',
				packageInfoTotalWeight: '21',
				requestId: expect.any(String)
			})
		);
		expect(goto).not.toHaveBeenCalled();
		expect(advanceUpsQuote).not.toHaveBeenCalled();
		expect(view.getByRole('button', { name: 'Get Quote' })).toBeDisabled();
		pending.resolve(1234);
		await flush();
		expect(goto).toHaveBeenCalledExactlyOnceWith('/ups/quote/1234');
	});
	it('shows validation followed by rates progress on the destination page', async () => {
		const validation = deferred<UpsQuoteView>(),
			rates = deferred<UpsQuoteView>();
		vi.mocked(advanceUpsQuote)
			.mockReturnValueOnce(validation.promise as never)
			.mockReturnValueOnce(rates.promise as never);
		const initial = quote();
		const view = render(Detail, { data: { quote: initial } } as never);
		expect(view.getByRole('heading', { name: 'Quote 1234' })).toBeInTheDocument();
		expect(view.getByText('Validating destination address…')).toBeInTheDocument();
		expect(view.getByText('UPS rates: Waiting for address validation')).toBeInTheDocument();
		validation.resolve({
			...initial,
			isValidated: true,
			generation: { validation: 'complete', rates: 'pending' }
		});
		await flush();
		expect(view.getByText('Address validation: Complete')).toBeInTheDocument();
		expect(view.getByText('Getting UPS rates…')).toBeInTheDocument();
		expect(view.queryByRole('table')).not.toBeInTheDocument();
		rates.resolve({
			...initial,
			generation: { validation: 'complete', rates: 'complete' },
			rates: [{ description: 'Ground', rate: 25 }]
		});
		await flush();
		expect(view.getByText('UPS rates: Complete')).toBeInTheDocument();
		expect(view.getByRole('table')).toHaveTextContent('Ground');
		expect(view.getByRole('table')).toHaveTextContent('$25.00');
		expect(advanceUpsQuote).toHaveBeenCalledTimes(2);
	});
	it('shows validation as not requested while rates load', async () => {
		vi.mocked(advanceUpsQuote).mockReturnValue(new Promise(() => {}) as never);
		const view = render(Detail, {
			data: { quote: { ...quote(), generation: { validation: 'skipped', rates: 'pending' } } }
		} as never);
		expect(view.getByText('Address validation: Not requested')).toBeInTheDocument();
		expect(view.getByText('Getting UPS rates…')).toBeInTheDocument();
	});
	it('shows persisted failures and retries the same quote without creating a new quote', async () => {
		const initial = {
			...quote(),
			generation: { validation: 'complete', rates: 'failed', message: 'UPS unavailable' }
		} as UpsQuoteView;
		vi.mocked(advanceUpsQuote).mockResolvedValue({
			...initial,
			generation: { validation: 'complete', rates: 'complete' },
			rates: [{ description: 'Ground', rate: 25 }]
		} as never);
		const view = render(Detail, { data: { quote: initial } } as never);
		expect(advanceUpsQuote).not.toHaveBeenCalled();
		expect(view.getByRole('alert')).toHaveTextContent('UPS unavailable');
		await fireEvent.click(view.getByRole('button', { name: 'Retry' }));
		await flush();
		expect(advanceUpsQuote).toHaveBeenCalledExactlyOnceWith({ quote: 1234, retry: true });
		expect(createUpsQuote).not.toHaveBeenCalled();
		expect(view.getByText('UPS rates: Complete')).toBeInTheDocument();
	});
	it('keeps completed historical quotes readable without regenerating them', () => {
		const initial = quote();
		delete initial.generation;
		initial.rates = [{ description: 'Ground', rate: 18.25 }];
		const view = render(Detail, { data: { quote: initial } } as never);
		expect(view.getByRole('table')).toHaveTextContent('$18.25');
		expect(view.queryByText('Quote progress')).not.toBeInTheDocument();
		expect(advanceUpsQuote).not.toHaveBeenCalled();
	});
});
