import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import Quote from '../../routes/(private)/(padded)/shipping/quote/+page.svelte';
import Markups from '../../routes/(private)/(padded)/admin/shipping/markups/+page.svelte';
import Detail from '../../routes/(private)/(padded)/shipping/quotes/[number]/+page.svelte';
import Finder from '../../routes/(private)/(padded)/shipping/quote-finder/+page.svelte';
import { legacyQuoteView } from './legacy';
import { blankRequest } from './types';
const submitHandlers = vi.hoisted(() => new Map<HTMLFormElement, SubmitFunction>());
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: SubmitFunction) => {
		submitHandlers.set(form, submit);
		return { destroy: () => submitHandlers.delete(form) };
	}
}));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
vi.mock('sveltewind/transitions', async (original) => ({
	...(await original<typeof import('sveltewind/transitions')>()),
	subtleReveal: () => ({ duration: 0 })
}));
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	vi.stubGlobal('matchMedia', () => ({
		matches: true,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	}));
});
afterEach(() => {
	cleanup();
	submitHandlers.clear();
	vi.unstubAllGlobals();
});

function quoteData() {
	const branch = { _id: 'a'.repeat(24), number: 2046, label: 'ABTL' };
	return {
		requestId: crypto.randomUUID(),
		shipDate: '2026-11-11',
		initialRequest: null,
		locals: { user: { branches: [branch], defaultBranch: branch } }
	};
}
describe('shipping forms', () => {
	it('shares the quote layout and shows saved staging LTL prices with configurable detail columns', async () => {
		const view = render(Detail, {
			data: {
				quote: {
					number: '123',
					origin: 'shipping',
					createdAt: null,
					request: blankRequest('2026-11-11'),
					shipFrom: { city: 'Caledonia', state: 'NY', zip: '14423' },
					shipTo: { city: 'Highland Park', state: 'TX', zip: '75219' },
					attempts: [],
					rates: [
						{ service: 'UPS', description: 'Ground', carrier: 'UPS' },
						{
							service: 'LTL',
							description: 'LTL standard',
							carrier: 'Test Freight',
							staging: true,
							freightClass: '55',
							transitDays: 3,
							estimatedDeliveryDate: '2026-11-16'
						}
					].map((rate) => ({
						...rate,
						rateBasis: 'negotiated',
						costCents: 10000,
						priceCents: 12000,
						markup: { percentBps: 2000, amountCents: 2000, label: 'Test markup', revision: 1 }
					}))
				}
			}
		} as never);
		expect(view.getByRole('columnheader', { name: 'Transit estimate' })).toBeInTheDocument();
		expect(view.getByText('Staging test rate · Class 55')).toBeInTheDocument();
		expect(view.getByText('3 business days - 2026-11-16')).toBeInTheDocument();
		expect(view.getAllByText('$120.00')).toHaveLength(2);
		const rows = view.getAllByRole('row');
		for (const row of rows.filter((row) => row.querySelector('td')))
			expect(row.querySelectorAll('td')).toHaveLength(7);
		expect(view.getByRole('region', { name: 'Quote details' })).toBeInTheDocument();
		expect(view.getByRole('region', { name: 'Quote rates' })).toContainElement(
			view.getByRole('heading', { name: 'Quote progress' })
		);
		await fireEvent.click(view.getByRole('button', { name: 'Displayed columns' }));
		await fireEvent.click(view.getByRole('checkbox', { name: /^Carrier$/ }));
		await fireEvent.click(view.getByRole('button', { name: 'Done' }));
		expect(view.queryByRole('columnheader', { name: /^Carrier$/ })).not.toBeInTheDocument();
		expect(view.getAllByText('$120.00')).toHaveLength(2);
	});
	it('shares the actual UPS addresses, package options and Extras without unwanted fields', async () => {
		const view = render(Quote, { data: quoteData() } as never);
		expect(view.queryByRole('link', { name: 'Quote history' })).not.toBeInTheDocument();
		const services = view.getByRole('combobox', { name: 'Services to quote' });
		expect(services).toHaveValue('Both');
		expect(
			view.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
		).toEqual(['Services to quote', 'Shipment Details', 'Package Info', 'Extras']);
		expect(
			view.getByRole('heading', { name: 'Shipment Details' }).parentElement
		).not.toContainElement(services);
		for (const name of ['Shipment Details', 'Package Info', 'Extras'])
			expect(view.getByRole('heading', { name })).toBeInTheDocument();
		for (const name of [
			'shipDate',
			'customer',
			'reference',
			'shipFrom.residential',
			'shipTo.residential'
		])
			expect(view.container.querySelector('[name="' + name + '"]')).toBeNull();
		expect(view.getByRole('tab', { name: 'Simple' })).toHaveAttribute('aria-selected', 'true');
		expect(view.getByRole('tab', { name: 'Advanced' })).toBeInTheDocument();
		expect(view.getByRole('tab', { name: 'Cases / units' })).toBeInTheDocument();
		const field = (name: string) =>
			view.container.querySelector<HTMLInputElement>('[name="' + name + '"]')!;
		await fireEvent.input(field('shipToZIP'), { target: { value: '10001' } });
		await fireEvent.change(field('shipToZIP'));
		expect(field('shipToCity')).toHaveValue('New York');
		expect(field('shipToState')).toHaveValue('NY');
		await fireEvent.click(view.getByRole('button', { name: 'Swap Ship From and Ship To' }));
		const form = view.container.querySelector('form')!;
		expect(new FormData(form).get('shipFromZIP')).toBe('10001');
		expect(new FormData(form).get('_branchId')).toBe('a'.repeat(24));
		expect(new FormData(form).get('isValidated')).toBe('true');
		await fireEvent.click(
			view.container.querySelector('input[name="isValidated"][value="false"]')!
		);
		expect(new FormData(form).get('isValidated')).toBe('false');
		expect(field('shipToAddress')).not.toBeRequired();
	});
	it('supports shared UPS advanced rows and resets them with a fresh request ID', async () => {
		const data = quoteData();
		const view = render(Quote, { data, form: { error: 'Previous request failed.' } } as never);
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Total Packages' }), {
			target: { value: '2' }
		});
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Total Weight (lbs)' }), {
			target: { value: '50' }
		});
		await fireEvent.click(view.getByRole('tab', { name: 'Advanced' }));
		await fireEvent.click(view.getByRole('button', { name: 'Duplicate rate row 1' }));
		const form = view.container.querySelector('form')!;
		const rows = JSON.parse(String(new FormData(form).get('rateScenarios')));
		expect(rows).toHaveLength(2);
		expect(rows[0].id).not.toBe(rows[1].id);
		expect(Number(rows[1].totalWeight)).toBe(50);
		await fireEvent.change(view.container.querySelector('[name="services"]')!, {
			target: { value: 'Both' }
		});
		await fireEvent.click(view.getByRole('checkbox', { name: 'Liftgate delivery' }));
		await fireEvent.click(view.getByRole('button', { name: 'Reset' }));
		const reset = new FormData(form);
		expect(reset.get('requestId')).not.toBe(data.requestId);
		expect(reset.get('_branchId')).toBe('a'.repeat(24));
		expect(reset.get('services')).toBe('Both');
		expect(JSON.parse(String(reset.get('rateScenarios')))).toHaveLength(1);
		expect(view.getByRole('tab', { name: 'Simple' })).toHaveAttribute('aria-selected', 'true');
		expect(view.getByRole('alert')).toHaveTextContent(/^$/);
		await fireEvent.change(view.container.querySelector('[name="services"]')!, {
			target: { value: 'Both' }
		});
		expect(view.getByRole('checkbox', { name: 'Liftgate delivery' })).not.toBeChecked();
	});
	it('expands collapsed mobile sections when a field fails validation', async () => {
		vi.stubGlobal('matchMedia', () => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		}));
		const view = render(Quote, { data: quoteData() } as never);
		const sections = view.container.querySelectorAll('details');
		expect(sections).toHaveLength(4);
		expect(sections[0]).toHaveAttribute('open');
		expect(sections[1]).toHaveAttribute('open');
		expect(sections[2]).not.toHaveAttribute('open');
		const weight = view.container.querySelector('input[name="packageInfoTotalWeight"]')!;
		await fireEvent.invalid(weight);
		expect(sections[2]).toHaveAttribute('open');
		expect(sections[3]).not.toHaveAttribute('open');
		await fireEvent.invalid(view.container.querySelector('input[name="isValidated"]')!);
		expect(sections[3]).toHaveAttribute('open');
	});
	it('shows submission progress, prevents duplicate submissions, and retains entered values', async () => {
		const view = render(Quote, { data: quoteData() } as never);
		const form = view.container.querySelector('form')!;
		await fireEvent.input(view.getByRole('spinbutton', { name: 'Total Packages' }), {
			target: { value: '3' }
		});
		const finish = await submitHandlers.get(form)!({ cancel: vi.fn() } as never);
		await tick();
		expect(view.getByRole('button', { name: 'Get quotes' })).toBeDisabled();
		expect(view.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
		const cancel = vi.fn();
		await submitHandlers.get(form)!({ cancel } as never);
		expect(cancel).toHaveBeenCalledOnce();
		if (typeof finish !== 'function') throw new Error('Missing submit completion handler');
		const update = vi.fn(async () => {});
		await finish({ update } as never);
		await tick();
		expect(update).toHaveBeenCalledWith({ reset: false });
		expect(new FormData(form).get('packageInfoTotalPackages')).toBe('3');
		expect(view.getByRole('button', { name: 'Get quotes' })).not.toBeDisabled();
		expect(view.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
	});
	it('uses the native finder table without an extra heading, search form, or custom pagination', async () => {
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {}
				disconnect() {}
				unobserve() {}
			}
		);
		const request = {
			services: 'UPS',
			shipTo: { address: '123 Main', city: 'Caledonia', state: 'NY', zip: '14423' }
		};
		const view = render(Finder, {
			data: {
				columns: [
					{ key: 'number', label: 'Quote', type: 'string' },
					{ key: 'request.shipTo.city', label: 'City', type: 'string' },
					{ key: 'createdAt', type: 'timestamp' },
					{ key: 'updatedAt', type: 'timestamp' },
					{ key: '_createdById', type: 'select', options: [] }
				],
				settings: {
					_routeId: 'a'.repeat(24),
					columnsOrder: [],
					currentPage: 0,
					filter: [],
					rowsPerPage: 10,
					sortDirection: 'asc',
					sortKey: 'number',
					isPaginateable: true
				},
				rows: Promise.resolve([
					{ _id: '1', number: 'S-000001', origin: 'shipping', request },
					{
						_id: '2',
						number: '123',
						origin: 'legacy-ups',
						request,
						packageTotalCount: 2,
						packageTotalWeight: 20
					}
				]),
				totalRows: Promise.resolve(12)
			}
		} as never);
		await tick();
		await Promise.resolve();
		await tick();
		expect(view.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
		expect(
			view.queryByText('Search quote, customer, reference, or destination')
		).not.toBeInTheDocument();
		expect(
			view.getAllByRole('link', { name: 'View' }).map((link) => link.getAttribute('href'))
		).toEqual(['/shipping/quotes/S-000001', '/shipping/quotes/123']);
		expect(view.getAllByRole('link', { name: 'Duplicate' })[0]).toHaveAttribute(
			'href',
			'/shipping/quote?from=S-000001'
		);
		const forms = Array.from(
			view.container.querySelectorAll<HTMLFormElement>('form[action="/api/mongooseTable?/find"]')
		);
		expect(forms.length).toBeGreaterThan(4);
		expect(forms.some((form) => new FormData(form).get('currentPage') === '1')).toBe(true);
		const filter = view.container.querySelector('svg.lucide-funnel')!.closest('button')!;
		await fireEvent.click(filter);
		expect(view.getByRole('dialog')).toBeInTheDocument();
		expect(view.getByRole('dialog').querySelector('form')).toHaveAttribute(
			'action',
			'/api/mongooseTable?/find'
		);
	});
	it('requires selected service details, retains values when switching, and posts native form values', async () => {
		const branch = { _id: 'a'.repeat(24), number: 2046, label: 'ABTL' };
		const view = render(Quote, {
			data: {
				requestId: crypto.randomUUID(),
				shipDate: '2026-11-10',
				initialRequest: null,
				locals: { user: { branches: [branch], defaultBranch: branch } }
			}
		} as never);
		const services = view.container.querySelector('select[name="services"]')!;
		await fireEvent.change(services, { target: { value: 'UPS' } });
		expect(view.queryByText('LTL freight')).not.toBeInTheDocument();
		const weight = view.getByRole('spinbutton', { name: 'Total Weight (lbs)' });
		await fireEvent.input(weight, { target: { value: '25' } });
		await fireEvent.input(weight, { target: { value: '' } });
		await fireEvent.input(weight, { target: { value: '25' } });
		await fireEvent.change(services, { target: { value: 'Both' } });
		expect(view.getByText('LTL freight')).toBeInTheDocument();
		const nmfc = view.getByRole('textbox', { name: 'Freight item 1 NMFC code' });
		expect(nmfc).toBeRequired();
		await fireEvent.input(nmfc, { target: { value: '123456-01' } });
		await fireEvent.change(services, { target: { value: 'UPS' } });
		expect(view.queryByText('LTL freight')).not.toBeInTheDocument();
		await fireEvent.change(services, { target: { value: 'LTL' } });
		expect(view.queryByRole('tab', { name: 'Simple' })).not.toBeInTheDocument();
		expect(view.getByRole('textbox', { name: 'Freight item 1 NMFC code' })).toHaveValue(
			'123456-01'
		);
		await fireEvent.change(services, { target: { value: 'Both' } });
		expect(view.getByRole('spinbutton', { name: 'Total Weight (lbs)' })).toHaveValue(25);
		await fireEvent.click(view.getByRole('checkbox', { name: 'Liftgate delivery' }));
		await tick();
		const fields = new FormData(view.container.querySelector('form')!);
		expect(fields.get('deliveryLiftgate')).toBe('on');
		expect(fields.get('services')).toBe('Both');
	});
	it('uses the default NMFC for new and reset freight items while duplicates retain their edited code', async () => {
		const view = render(Quote, { data: quoteData() } as never);
		expect(view.container.querySelector('[name$=".description"]')).toBeNull();
		expect(view.container.querySelector('[name$=".freightClass"]')).toBeNull();
		const first = view.getByRole('textbox', { name: 'Freight item 1 NMFC code' });
		expect(first).toHaveValue('153500-02');
		await fireEvent.input(first, { target: { value: '123456-01' } });
		await fireEvent.click(view.getByRole('button', { name: 'Add freight item' }));
		expect(view.getByRole('textbox', { name: 'Freight item 2 NMFC code' })).toHaveValue(
			'153500-02'
		);
		await fireEvent.click(view.getByRole('button', { name: 'Duplicate freight 1' }));
		expect(view.getByRole('textbox', { name: 'Freight item 3 NMFC code' })).toHaveValue(
			'123456-01'
		);
		await fireEvent.click(view.getByRole('button', { name: 'Reset' }));
		expect(view.getByRole('textbox', { name: 'Freight item 1 NMFC code' })).toHaveValue(
			'153500-02'
		);
	});
	it('opens markup CRUD in separate dialogs, supports blank upper bounds, and switches service tabs', async () => {
		const view = render(Markups, {
			data: {
				configs: [
					{ service: 'UPS', revision: 0, ranges: [] },
					{ service: 'LTL', revision: 0, ranges: [] }
				]
			}
		} as never);
		expect(view.queryByRole('dialog')).not.toBeInTheDocument();
		await fireEvent.click(view.getByRole('button', { name: 'Add markup range' }));
		expect(view.getByRole('dialog')).toBeInTheDocument();
		const maximum = view.getByRole('dialog').querySelector('input[name="maximum"]')!;
		await fireEvent.input(maximum, { target: { value: '100' } });
		await fireEvent.input(maximum, { target: { value: '' } });
		expect(new FormData(view.getByRole('dialog').querySelector('form')!).get('maximum')).toBe('');
		await fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
		await fireEvent.click(view.getByRole('tab', { name: 'LTL' }));
		expect(
			view.getByText('No LTL markup ranges yet. All LTL quotes currently use 0% markup.')
		).toBeInTheDocument();
	});
	it('shows saved legacy customer prices without applying current markup rules', () => {
		const quote = legacyQuoteView({
			quote: 123,
			rates: [null, { description: 'Ground', rate: 123.45 }]
		});
		const view = render(Detail, { data: { quote } } as never);
		expect(view.getByText('$123.45')).toBeInTheDocument();
		expect(view.getByText(/Current markup rules are not applied/)).toBeInTheDocument();
		expect(view.getByRole('link', { name: 'Open original UPS quote' })).toHaveAttribute(
			'href',
			'/ups/quote/123'
		);
	});
});
