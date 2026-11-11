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
import { UPS_SERVICES, type UpsQuoteView } from './quote';
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	slide: () => ({ duration: 0 }),
	scale: () => ({ duration: 0 })
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
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
describe('UPS quote feedback', () => {
	it('offers all weight options in Simple and preserves settings between shipment tabs', async () => {
		vi.mocked(createUpsQuote).mockResolvedValue(1234 as never);
		const view = editor();
		await flush();
		await fireEvent.click(view.getByText('Package Info').closest('summary')!);
		const advanced = view.getByRole('tab', { name: 'Advanced' });
		const simple = view.getByRole('tab', { name: 'Simple' });
		expect(simple).toHaveAttribute('aria-selected', 'true');
		for (const name of ['Total weight', 'Per package', 'Different weights', 'Cases / units'])
			expect(view.getByRole('tab', { name })).toBeInTheDocument();
		expect(view.queryByText('Build rows from case quantities')).not.toBeInTheDocument();
		expect(view.queryByRole('checkbox', { name: 'Ground' })).not.toBeInTheDocument();
		expect(view.getByRole('spinbutton', { name: 'Total Packages' })).toHaveValue(2);
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Total Weight (lbs)' }), {
			target: { value: '45' }
		});
		await fireEvent.click(advanced);
		expect(view.getByRole('spinbutton', { name: 'Total Weight (lbs)' })).toHaveValue(45);
		await fireEvent.click(view.getByRole('checkbox', { name: 'Ground' }));
		await fireEvent.click(simple);
		expect(simple).toHaveAttribute('aria-selected', 'true');
		expect(view.getByRole('spinbutton', { name: 'Total Weight (lbs)' })).toHaveValue(45);
		await fireEvent.submit(view.container.querySelector('form')!);
		await flush();
		const fields = vi.mocked(createUpsQuote).mock.calls[0][0] as { rateScenarios: string };
		const [row] = JSON.parse(fields.rateScenarios);
		expect(Number(row.totalWeight)).toBe(45);
		expect(row.services).not.toContain('03');
		await fireEvent.click(advanced);
		expect(view.getByRole('checkbox', { name: 'Ground' })).not.toBeChecked();
	});
	it('calculates and submits case quantities entirely in Simple', async () => {
		vi.mocked(createUpsQuote).mockResolvedValue(1234 as never);
		const view = editor();
		await flush();
		await fireEvent.click(view.getByText('Package Info').closest('summary')!);
		await fireEvent.click(view.getByRole('tab', { name: 'Cases / units' }));
		for (const [name, value] of [
			['Total units', '11000'],
			['Units per case', '2500'],
			['Full case weight (lbs)', '20'],
			['Empty carton weight (lbs)', '2']
		])
			await fireEvent.input(view.getByRole('spinbutton', { name }), { target: { value } });
		expect(view.getByText(/5 cartons.*89.2 lbs total/)).toBeInTheDocument();
		await fireEvent.click(view.getByRole('tab', { name: 'Advanced' }));
		await fireEvent.click(view.getByRole('tab', { name: 'Simple' }));
		expect(view.getByRole('tab', { name: 'Cases / units' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(view.getByRole('spinbutton', { name: 'Total units' })).toHaveValue(11000);
		await fireEvent.submit(view.container.querySelector('form')!);
		await flush();
		const fields = vi.mocked(createUpsQuote).mock.calls[0][0] as { rateScenarios: string };
		const [row] = JSON.parse(fields.rateScenarios);
		expect(row.weightMode).toBe('cartons');
		expect(Number(row.unitQuantity)).toBe(11000);
		expect(Number(row.tareWeight)).toBe(2);
	});
	it('builds editable case rows for multiple quantities and submits their packing settings', async () => {
		vi.mocked(createUpsQuote).mockResolvedValue(1234 as never);
		const view = editor();
		await flush();
		await fireEvent.click(view.getByText('Package Info').closest('summary')!);
		await fireEvent.click(view.getByRole('tab', { name: 'Advanced' }));
		await fireEvent.click(view.getByText('Build rows from case quantities').closest('summary')!);
		const helper = within(view.getByText('Build rows from case quantities').closest('details')!);
		await fireEvent.input(helper.getByRole('textbox', { name: 'Units per case' }), {
			target: { value: '2500' }
		});
		await fireEvent.input(helper.getByRole('textbox', { name: 'Full case weight (lbs)' }), {
			target: { value: '20' }
		});
		await fireEvent.input(helper.getByRole('textbox', { name: 'Total quantities, one per line' }), {
			target: { value: '10,000\n20,000\n30,000' }
		});
		await fireEvent.click(helper.getByRole('button', { name: 'Add calculated rate rows' }));
		await flush();
		// The existing populated manual row is retained alongside the three estimates.
		expect(view.getAllByRole('region', { name: /^Rate scenario/ })).toHaveLength(4);
		const firstEstimate = within(view.getByRole('region', { name: 'Rate scenario 2' }));
		for (const service of UPS_SERVICES.filter((service) => service.code !== '03'))
			await fireEvent.click(firstEstimate.getByRole('checkbox', { name: service.title }));
		expect(
			within(view.getByRole('region', { name: 'Rate scenario 3' })).getByRole('checkbox', {
				name: 'Next Day Air'
			})
		).toBeChecked();
		await fireEvent.click(view.getByRole('tab', { name: 'Simple' }));
		expect(view.getByRole('spinbutton', { name: 'Total Packages' })).toHaveValue(2);
		await fireEvent.click(view.getByRole('tab', { name: 'Advanced' }));
		expect(view.getAllByRole('region', { name: /^Rate scenario/ })).toHaveLength(4);
		await fireEvent.submit(view.container.querySelector('form')!);
		await flush();
		const submitted = vi.mocked(createUpsQuote).mock.calls[0][0] as { rateScenarios: string };
		const rows = JSON.parse(submitted.rateScenarios);
		expect(rows.slice(1).map((row: { unitQuantity: string }) => row.unitQuantity)).toEqual([
			'10000',
			'20000',
			'30000'
		]);
		expect(rows[1]).toMatchObject({
			services: ['03'],
			weightMode: 'cartons',
			unitsPerCarton: '2500',
			cartonWeight: '20',
			partialCase: 'prorate'
		});
	});
	it('shows completed scenario prices and unavailable services while another row is pending', async () => {
		vi.useFakeTimers();
		const batch = deferred<UpsQuoteView>();
		const scenario = {
			id: 'first',
			label: '',
			unitQuantity: 10000,
			services: ['03', '12'],
			weightMode: 'cartons',
			packageGroups: [{ quantity: 4, weight: 20 }],
			packageTotalCount: 4,
			packageTotalWeight: 80,
			packageWeight: 20,
			status: 'complete',
			rates: [{ description: 'Ground', serviceCode: '03', rate: 12.5 }],
			unavailableServices: ['12'],
			message: ''
		};
		const initial = {
			...quote(),
			generation: { validation: 'skipped', rates: 'pending' },
			scenarios: [
				scenario,
				{ ...scenario, id: 'second', unitQuantity: 20000, status: 'pending', rates: [] }
			]
		} as UpsQuoteView;
		const progress = {
			...initial,
			generation: { validation: 'skipped', rates: 'running' },
			scenarios: initial.scenarios!.map((row) => ({
				...row,
				status: 'complete',
				rates: scenario.rates
			}))
		} as UpsQuoteView;
		vi.mocked(advanceUpsQuote).mockImplementation(
			(input) =>
				((input as { poll?: boolean }).poll ? Promise.resolve(progress) : batch.promise) as never
		);
		const view = render(Detail, { data: { quote: initial } } as never);
		await flush();
		const result = within(view.getByRole('region', { name: 'Rate results 1' }));
		expect(result.getByRole('table')).toHaveTextContent('$12.50');
		expect(result.getByRole('table')).toHaveTextContent('Unavailable');
		expect(view.getByText('1 of 2 rate rows complete')).toBeInTheDocument();
		expect(
			within(view.getByRole('region', { name: 'Rate results 2' })).queryByRole('table')
		).not.toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(advanceUpsQuote).toHaveBeenCalledWith({ quote: 1234, poll: true });
		expect(view.getByText('2 of 2 rate rows complete')).toBeInTheDocument();
		expect(
			within(view.getByRole('region', { name: 'Rate results 2' })).getByRole('table')
		).toHaveTextContent('$12.50');
		batch.resolve({ ...progress, generation: { validation: 'skipped', rates: 'complete' } });
		await flush();
		const calls = vi.mocked(advanceUpsQuote).mock.calls.length;
		await vi.advanceTimersByTimeAsync(2000);
		expect(advanceUpsQuote).toHaveBeenCalledTimes(calls);
	});
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
		const sections = [...view.container.querySelectorAll('details')].filter((element) =>
			['Shipment Details', 'Package Info', 'Extras'].includes(
				element.querySelector('summary')?.textContent?.trim() ?? ''
			)
		);
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
		expect(sections.every((section) => !section.isConnected)).toBe(true);
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
