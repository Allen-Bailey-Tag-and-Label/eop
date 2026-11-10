import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Quote from '../../routes/(private)/(padded)/shipping/quote/+page.svelte';
import Markups from '../../routes/(private)/(padded)/admin/shipping/markups/+page.svelte';
import Detail from '../../routes/(private)/(padded)/shipping/quotes/[number]/+page.svelte';
import Finder from '../../routes/(private)/(padded)/shipping/quote-finder/+page.svelte';
import { legacyQuoteView } from './legacy';
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
vi.mock('sveltewind/transitions', async (original) => ({
	...(await original<typeof import('sveltewind/transitions')>()),
	subtleReveal: () => ({ duration: 0 })
}));
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
describe('shipping forms', () => {
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
		expect(view.queryByText('LTL freight')).not.toBeInTheDocument();
		const weight = view.getByRole('spinbutton', { name: 'Package group 1 Weight each (lb)' });
		await fireEvent.input(weight, { target: { value: '25' } });
		await fireEvent.input(weight, { target: { value: '' } });
		await fireEvent.input(weight, { target: { value: '25' } });
		await fireEvent.change(services, { target: { value: 'Both' } });
		expect(view.getByText('LTL freight')).toBeInTheDocument();
		const description = view.container.querySelector('input[name$=".description"]')!;
		expect(description).toBeRequired();
		await fireEvent.input(description, { target: { value: 'Tags' } });
		await fireEvent.change(services, { target: { value: 'UPS' } });
		expect(view.queryByText('LTL freight')).not.toBeInTheDocument();
		await fireEvent.change(services, { target: { value: 'LTL' } });
		expect(view.queryByText('UPS packages')).not.toBeInTheDocument();
		expect(view.container.querySelector('input[name$=".description"]')).toHaveValue('Tags');
		await fireEvent.change(services, { target: { value: 'Both' } });
		expect(view.getByRole('spinbutton', { name: 'Package group 1 Weight each (lb)' })).toHaveValue(
			25
		);
		await fireEvent.click(view.getByRole('checkbox', { name: 'Liftgate delivery' }));
		await tick();
		const fields = new FormData(view.container.querySelector('form')!);
		expect(fields.get('deliveryLiftgate')).toBe('on');
		expect(fields.get('services')).toBe('Both');
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
