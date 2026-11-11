import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/svelte';
import RateComparison from './RateComparison.svelte';
import type { QuoteScenario } from './quote';

afterEach(cleanup);
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
	it('transposes service/quantity cells while preserving saved dollar values, zero rates and missing selections', async () => {
		const view = render(RateComparison, { scenarios });
		const table = within(view.getByRole('table', { name: 'UPS rate comparison' }));
		expect(table.getAllByRole('columnheader')).toHaveLength(3);
		expect(table.getAllByRole('rowheader')).toHaveLength(3);
		const ground = table.getByRole('rowheader', { name: 'Ground' }).closest('tr')!;
		expect(
			within(ground)
				.getAllByRole('cell')
				.map((cell) => cell.textContent)
		).toEqual(['$12.50', '$25.00']);
		expect(table.getByText('$0.00')).toBeInTheDocument();
		expect(table.getByText('Unavailable')).toBeInTheDocument();
		expect(table.getAllByText('Not selected')).toHaveLength(2);
		await fireEvent.click(view.getByRole('tab', { name: 'Quantities as rows' }));
		expect(table.getAllByRole('columnheader')).toHaveLength(4);
		expect(table.getAllByRole('rowheader')).toHaveLength(2);
		const first = table.getByRole('rowheader', { name: /First option/ }).closest('tr')!;
		expect(
			within(first)
				.getAllByRole('cell')
				.map((cell) => cell.textContent)
		).toEqual(['$12.50', '$0.00', 'Not selected']);
		const second = table.getByRole('rowheader', { name: /20,000 units/ }).closest('tr')!;
		expect(
			within(second)
				.getAllByRole('cell')
				.map((cell) => cell.textContent)
		).toEqual(['$25.00', 'Not selected', 'Unavailable']);
		await fireEvent.click(view.getByRole('tab', { name: 'Services as rows' }));
		expect(table.getAllByRole('columnheader')).toHaveLength(3);
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
