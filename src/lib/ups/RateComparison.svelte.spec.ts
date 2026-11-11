import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import RateComparison from './RateComparison.svelte';
import type { QuoteScenario } from './quote';
import { exportFunctions } from '$lib/components/Datatable/exportFunctions';
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
			unobserve() {}
		}
	);
});
const scenarios: QuoteScenario[] = [
	{
		id: 'a',
		label: 'First option',
		unitQuantity: 10000,
		services: ['03', '12'],
		weightMode: 'total',
		packageGroups: [{ quantity: 2, weight: 10 }],
		packageTotalCount: 2,
		packageTotalWeight: 20,
		packageWeight: 10,
		status: 'complete',
		rates: [
			{ description: 'Ground', serviceCode: '03', rate: 12.5 },
			{ description: '3 Day Select', serviceCode: '12', rate: 0 }
		],
		unavailableServices: [],
		message: ''
	},
	{
		id: 'b',
		label: '',
		unitQuantity: 20000,
		services: ['03', '02'],
		weightMode: 'total',
		packageGroups: [{ quantity: 3, weight: 10 }],
		packageTotalCount: 3,
		packageTotalWeight: 30,
		packageWeight: 10,
		status: 'complete',
		rates: [{ description: 'Ground', serviceCode: '03', rate: 25 }],
		unavailableServices: ['02'],
		message: ''
	}
];
describe('UPS rate comparison', () => {
	it('sorts dollar rates numerically and exports the active orientation with formatted values', async () => {
		const exported = vi.fn(async () => {});
		vi.spyOn(exportFunctions, 'get').mockReturnValue(exported);
		const view = render(RateComparison, {
			scenarios: [
				{
					...scenarios[0],
					rates: [
						{ description: 'Ground', serviceCode: '03', rate: 100 },
						{ description: '3 Day Select', serviceCode: '12', rate: 9 }
					]
				},
				scenarios[1]
			]
		});
		const firstPrices = () =>
			within(view.getByRole('table'))
				.getAllByRole('row')
				.filter((row) => row.querySelector('td'))
				.map((row) => within(row).getAllByRole('cell')[1].textContent);
		const header = view.getByRole('button', { name: /First option/ });
		await fireEvent.click(header);
		expect(firstPrices()).toEqual(['$9.00', '$100.00', 'Not selected']);
		await fireEvent.click(header);
		expect(firstPrices()).toEqual(['$100.00', '$9.00', 'Not selected']);
		await fireEvent.click(view.getByRole('button', { name: 'Export data' }));
		await fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: 'Export' }));
		expect(exported).toHaveBeenLastCalledWith({
			headers: ['Service', 'First option - 10,000 units', '20,000 units'],
			data: [
				['Ground', '$100.00', '$25.00'],
				['3 Day Select', '$9.00', 'Not selected'],
				['2nd Day Air', 'Not selected', 'Unavailable']
			]
		});
		await fireEvent.click(view.getByRole('tab', { name: 'Quantities as rows' }));
		await fireEvent.click(view.getByRole('button', { name: 'Ground' }));
		expect(firstPrices()).toEqual(['$25.00', '$100.00']);
		await fireEvent.click(view.getByRole('button', { name: 'Export data' }));
		await fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: 'Export' }));
		expect(exported).toHaveBeenLastCalledWith({
			headers: ['Quantity', 'Ground', '3 Day Select', '2nd Day Air'],
			data: [
				['20,000 units', '$25.00', 'Not selected', 'Unavailable'],
				['First option - 10,000 units', '$100.00', '$9.00', 'Not selected']
			]
		});
	});
	it('transposes service/quantity cells while preserving saved dollar values, zero rates and missing selections', async () => {
		const view = render(RateComparison, { scenarios });
		expect(view.queryByRole('heading', { name: 'Rate comparison' })).not.toBeInTheDocument();
		const table = () => within(view.getByRole('table'));
		expect(table().getAllByRole('columnheader')).toHaveLength(3);
		expect(
			table()
				.getAllByRole('row')
				.filter((row) => row.querySelector('td'))
		).toHaveLength(3);
		const ground = table().getByRole('cell', { name: 'Ground' }).closest('tr')!;
		expect(
			within(ground)
				.getAllByRole('cell')
				.slice(1)
				.map((cell) => cell.textContent)
		).toEqual(['$12.50', '$25.00']);
		expect(table().getByText('$0.00')).toBeInTheDocument();
		expect(table().getByText('Unavailable')).toBeInTheDocument();
		expect(table().getAllByText('Not selected')).toHaveLength(2);
		await fireEvent.click(view.getByRole('tab', { name: 'Quantities as rows' }));
		expect(table().getAllByRole('columnheader')).toHaveLength(4);
		expect(
			table()
				.getAllByRole('row')
				.filter((row) => row.querySelector('td'))
		).toHaveLength(2);
		const first = table()
			.getByRole('cell', { name: /First option/ })
			.closest('tr')!;
		expect(
			within(first)
				.getAllByRole('cell')
				.slice(1)
				.map((cell) => cell.textContent)
		).toEqual(['$12.50', '$0.00', 'Not selected']);
		const second = table()
			.getByRole('cell', { name: /20,000 units/ })
			.closest('tr')!;
		expect(
			within(second)
				.getAllByRole('cell')
				.slice(1)
				.map((cell) => cell.textContent)
		).toEqual(['$25.00', 'Not selected', 'Unavailable']);
		await fireEvent.click(view.getByRole('tab', { name: 'Services as rows' }));
		expect(table().getAllByRole('columnheader')).toHaveLength(3);
	});
	it('retains pending and failed status and error details without showing stale rates', () => {
		const view = render(RateComparison, {
			scenarios: [
				{ ...scenarios[0], status: 'running' },
				{ ...scenarios[1], status: 'failed', message: 'Provider unavailable' }
			]
		});
		expect(view.queryByText('$12.50')).not.toBeInTheDocument();
		expect(view.getAllByText('Getting rates…')).toHaveLength(2);
		expect(view.getAllByText('Failed')).toHaveLength(2);
		expect(view.getByRole('alert')).toHaveTextContent('20,000 units: Provider unavailable');
	});
});
