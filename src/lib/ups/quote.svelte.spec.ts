import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
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
function editor() {
	return render(Create, {
		data: {
			locals: { user: { branches: [{ _id: 'b'.repeat(24), number: 2046 }] } },
			_branchId: '',
			isValidated: 'true',
			formData: {
				shipFrom: { address: '3177 Lehigh', city: 'Caledonia', state: 'NY', zip: '14423' },
				shipTo: { address: '1 Main', city: 'Pittsburgh', state: 'PA', zip: '15222' },
				packageInfo: { totalPackages: '2', totalWeight: '21' }
			}
		}
	} as never);
}
async function flush() {
	await tick();
	await Promise.resolve();
	await tick();
}
let desktop = false;
let resize: () => void;
beforeEach(() => {
	vi.clearAllMocks();
	desktop = false;
	vi.stubGlobal('matchMedia', () => ({
		get matches() {
			return desktop;
		},
		addEventListener: (_event: string, listener: () => void) => {
			resize = listener;
		},
		removeEventListener: vi.fn()
	}));
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
describe('UPS quote feedback', () => {
	it('swaps the complete origin and destination addresses', async () => {
		const view = editor();
		await flush();
		await fireEvent.click(view.getByRole('button', { name: 'Swap Ship From and Ship To' }));
		const fields = new FormData(view.container.querySelector('form')!);
		expect(fields.get('shipFromAddress')).toBe('1 Main');
		expect(fields.get('shipFromCity')).toBe('Pittsburgh');
		expect(fields.get('shipFromState')).toBe('PA');
		expect(fields.get('shipFromZIP')).toBe('15222');
		expect(fields.get('shipToAddress')).toBe('3177 Lehigh');
		expect(fields.get('shipToCity')).toBe('Caledonia');
		expect(fields.get('shipToState')).toBe('NY');
		expect(fields.get('shipToZIP')).toBe('14423');
	});
	it('accepts a per-package weight and submits the selected weight mode', async () => {
		vi.mocked(createUpsQuote).mockResolvedValue(1234 as never);
		const view = editor();
		await flush();
		await fireEvent.click(view.getByText('Package Info').closest('summary')!);
		await fireEvent.click(view.getByRole('tab', { name: 'Per package' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Weight per package (lbs)' }), {
			target: { value: '10' }
		});
		expect(view.getByText('2 packages · 20 lbs total')).toBeInTheDocument();
		await fireEvent.submit(view.container.querySelector('form')!);
		await flush();
		expect(createUpsQuote).toHaveBeenCalledWith(
			expect.objectContaining({
				weightMode: 'each',
				packageInfoTotalPackages: '2',
				packageInfoPackageWeight: '10'
			})
		);
	});
	it('adds and removes weight groups, preserves them across resizing, and submits unequal weights', async () => {
		vi.mocked(createUpsQuote).mockResolvedValue(1234 as never);
		const view = editor();
		await flush();
		await fireEvent.click(view.getByText('Package Info').closest('summary')!);
		await fireEvent.click(view.getByRole('tab', { name: 'Different weights' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Quantity for group 1' }), {
			target: { value: '1' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Weight for group 1 (lbs)' }), {
			target: { value: '10' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Add package group' }));
		await fireEvent.click(view.getByRole('button', { name: 'Remove package group 2' }));
		await fireEvent.click(view.getByRole('button', { name: 'Add package group' }));
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Weight for group 2 (lbs)' }), {
			target: { value: '20' }
		});
		desktop = true;
		resize();
		await flush();
		expect(view.getByText('2 packages · 30 lbs total')).toBeInTheDocument();
		await fireEvent.submit(view.container.querySelector('form')!);
		await flush();
		const fields = vi.mocked(createUpsQuote).mock.calls[0][0] as {
			weightMode: string;
			packageGroups: string;
		};
		expect(fields.weightMode).toBe('groups');
		expect(
			JSON.parse(fields.packageGroups).map((group: { quantity: string; weight: string }) => ({
				quantity: Number(group.quantity),
				weight: Number(group.weight)
			}))
		).toEqual([
			{ quantity: 1, weight: 10 },
			{ quantity: 1, weight: 20 }
		]);
	});
	it('shows saved package groups and duplicates using the saved quote', () => {
		desktop = true;
		const initial = {
			...quote(),
			weightMode: 'groups',
			packageGroups: [
				{ quantity: 1, weight: 10 },
				{ quantity: 1, weight: 20 }
			],
			generation: { validation: 'complete', rates: 'complete' }
		};
		const view = render(Detail, { data: { quote: initial } } as never);
		expect(view.getByText('1 package @ 10 lbs')).toBeInTheDocument();
		expect(view.getByText('1 package @ 20 lbs')).toBeInTheDocument();
		expect(view.getByRole('link', { name: 'Duplicate' })).toHaveAttribute(
			'href',
			'/ups/quote?from=1234'
		);
	});
	it('opens invalid mobile sections, keeps desktop sections expanded, and preserves input values across resizing', async () => {
		vi.mocked(createUpsQuote).mockReturnValue(new Promise(() => {}) as never);
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
		const sections = [...view.container.querySelectorAll('details')];
		expect(sections).toHaveLength(3);
		expect(sections[0].querySelector('summary')).toHaveTextContent('Shipment Details');
		expect(sections[0].open).toBe(true);
		expect(sections[1].open).toBe(false);
		const weight = view.container.querySelector('[name="packageInfoTotalWeight"]')!;
		await fireEvent.invalid(weight);
		await flush();
		expect(sections[1].open).toBe(true);
		const destination = view.container.querySelector('[name="shipToAddress"]')!;
		await fireEvent.input(destination, { target: { value: '2 Main' } });
		desktop = true;
		resize();
		await flush();
		expect(view.container.querySelectorAll('details')).toHaveLength(0);
		for (const title of ['Shipment Details', 'Package Info', 'Extras'])
			expect(view.getByRole('heading', { name: title })).toBeVisible();
		desktop = false;
		resize();
		await flush();
		expect(view.container.querySelectorAll('[name="shipToAddress"]')).toHaveLength(1);
		expect(new FormData(view.container.querySelector('form')!).get('shipToAddress')).toBe('2 Main');
		expect(
			within(view.getByRole('region', { name: 'Quote details' })).getByRole('button', {
				name: 'Get Quote'
			})
		).toBeInTheDocument();
	});
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
