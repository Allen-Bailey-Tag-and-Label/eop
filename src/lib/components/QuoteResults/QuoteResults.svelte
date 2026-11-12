<script lang="ts">
	import {
		Button,
		Checkbox,
		Datatable,
		Details,
		DialogActions,
		Div,
		Modal,
		P,
		Summary,
		Tabs,
		Td
	} from '$lib/components';
	import { currency } from '$lib/formats';
	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import { untrack, type ComponentProps } from 'svelte';
	import type { QuoteRateOption, QuoteRateService } from './types';
	import type { Row } from '$lib/components/Datatable/types';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<ComponentProps<typeof Div>, 'children'> & {
		scenarios: QuoteRateOption[];
		serviceOptions: QuoteRateService[];
		label?: string;
		detailColumns?: Column[];
		detailRows?: Row[];
		initialView?: 'services' | 'quantities' | 'details';
		sortServicesByRate?: boolean;
		detailSortKey?: string;
		initialHiddenColumns?: string[];
	};
	let {
		scenarios,
		serviceOptions,
		label = 'Quote rate comparison',
		detailColumns = [],
		detailRows = [],
		initialView = 'services',
		sortServicesByRate = false,
		detailSortKey,
		initialHiddenColumns = [],
		class: className,
		variants = [],
		...restProps
	}: Props = $props();
	let orientation = $state(untrack(() => initialView));
	let columnsOpen = $state(false);
	let hiddenColumns = $state<string[]>(untrack(() => [...initialHiddenColumns]));
	const visibleDetails = $derived(
		detailColumns.map((column) =>
			typeof column === 'string'
				? {
						key: column,
						isHidden: hiddenColumns.includes(column),
						isExportable: !hiddenColumns.includes(column)
					}
				: {
						...column,
						isHidden: hiddenColumns.includes(column.key),
						isExportable: !hiddenColumns.includes(column.key)
					}
		)
	);
	const services = $derived.by(() => {
		const selected = new Set(scenarios.flatMap((scenario) => scenario.services));
		return [
			...serviceOptions.map((service) => service.code).filter((code) => selected.has(code)),
			...Array.from(selected).filter(
				(code) => !serviceOptions.some((service) => service.code === code)
			)
		];
	});
	const serviceTitle = (code: string) =>
		serviceOptions.find((service) => service.code === code)?.title ?? code;
	const quantityTitle = (scenario: QuoteRateOption, index: number) =>
		scenario.label ||
		(scenario.unitQuantity
			? `${scenario.unitQuantity.toLocaleString('en-US')} units`
			: `Rate row ${index + 1}`);
	function rateValue(scenario: QuoteRateOption, code: string) {
		if (!scenario.services.includes(code)) return 'Not selected';
		if (scenario.status === 'failed') return 'Failed';
		if (scenario.status !== 'complete')
			return scenario.status === 'running' ? 'Getting rates…' : 'Waiting…';
		const rate = scenario.rates.find((rate) => rate.serviceCode === code);
		return rate ? rate.rate : 'Unavailable';
	}

	const formatRate = (value: unknown) =>
		typeof value === 'number' ? currency(value) : String(value ?? '');
	const compareRates = (a: unknown, b: unknown, direction: -1 | 1) => {
		if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction;
		if (typeof a === 'number') return -1;
		if (typeof b === 'number') return 1;
		return String(a).localeCompare(String(b)) * direction;
	};
	const optionTitle = (scenario: QuoteRateOption, index: number) =>
		quantityTitle(scenario, index) +
		(scenario.label && scenario.unitQuantity
			? ` - ${scenario.unitQuantity.toLocaleString('en-US')} units`
			: '');
	const columns = $derived<Column[]>([
		{ key: 'label', label: orientation === 'services' ? 'Service' : 'Quantity', type: 'string' },
		...(orientation === 'services'
			? scenarios.map((scenario, index) => ({
					key: `rate_${index}`,
					label: optionTitle(scenario, index)
				}))
			: services.map((code, index) => ({ key: `rate_${index}`, label: serviceTitle(code) }))
		).map(
			(column) =>
				({
					...column,
					type: 'function',
					snippet: rateCell,
					class: 'text-right whitespace-nowrap',
					compareFn: compareRates,
					valueFn: ({ key, object }) => formatRate(object[key])
				}) satisfies Column
		)
	]);
	const rows = $derived(
		orientation === 'services'
			? services.map((code) => ({
					label: serviceTitle(code),
					...Object.fromEntries(
						scenarios.map((scenario, index) => [`rate_${index}`, rateValue(scenario, code)])
					)
				}))
			: scenarios.map((scenario, index) => ({
					label: optionTitle(scenario, index),
					...Object.fromEntries(
						services.map((code, index) => [`rate_${index}`, rateValue(scenario, code)])
					)
				}))
	);
	// Datatable's sort settings describe the header; initial rows must also be ordered.
	const defaultRows = $derived(
		sortServicesByRate && orientation === 'services'
			? [...rows].sort((a, b) =>
					compareRates(Reflect.get(a, 'rate_0'), Reflect.get(b, 'rate_0'), 1)
				)
			: rows
	);
	const sortedDetails = $derived(
		detailSortKey
			? [...detailRows].sort((a, b) =>
					compareRates(Reflect.get(a, detailSortKey), Reflect.get(b, detailSortKey), 1)
				)
			: detailRows
	);
</script>

<Div
	{...restProps}
	{variants}
	class={twMerge('min-w-0 space-y-4', className)}
	role="region"
	aria-label={label}
>
	<Div class="min-w-0">
		<Div class="flex flex-wrap items-stretch justify-between">
			<Tabs
				class="gap-0 rounded-b-none p-0 [&_button]:rounded-b-none"
				aria-label="Rate table layout"
				bind:value={orientation}
				tabs={[
					{ title: 'Services as rows', value: 'services', disabled: !scenarios.length },
					{ title: 'Quantities as rows', value: 'quantities', disabled: !scenarios.length },
					...(detailColumns.length ? [{ title: 'Rate details', value: 'details' as const }] : [])
				]}
			/>
			{#if orientation === 'details'}<Button
					class="rounded-b-none"
					variants={['small']}
					onclick={() => (columnsOpen = true)}>Displayed columns</Button
				>{/if}
		</Div>
		{#key orientation}
			<Datatable
				settings={sortServicesByRate && orientation === 'services'
					? { sortKey: 'rate_0', sortDirection: 'asc' }
					: orientation === 'details' && detailSortKey
						? { sortKey: detailSortKey, sortDirection: 'asc' }
						: {}}
				class="rounded-t-none"
				columns={orientation === 'details' ? visibleDetails : columns}
				rows={orientation === 'details' ? sortedDetails : defaultRows}
				isCreatable={false}
				isEditable={false}
				isDeletable={false}
				isSelectable={false}
				isFilterable={false}
				isPaginateable={false}
				isColumnsReorderable={false}
			/>
		{/key}
	</Div>
	{#if scenarios.length}<Details>
			<Summary>Packing details</Summary>
			<Div class="grid gap-4 pt-4 sm:grid-cols-2">
				{#each scenarios as scenario, index (scenario.id)}{@render quantity(scenario, index)}{/each}
			</Div>
		</Details>{/if}
	{#each scenarios as scenario, index (scenario.id)}
		{#if scenario.message}<P role={scenario.status === 'failed' ? 'alert' : 'status'}
				>{quantityTitle(scenario, index)}: {scenario.message}</P
			>{/if}
	{/each}
</Div>

{#snippet rateCell({ key, object }: TdSnippet)}
	<Td class="text-right whitespace-nowrap">{formatRate(object[key])}</Td>
{/snippet}

{#snippet quantity(scenario: QuoteRateOption, index: number)}
	<Div class="min-w-40 space-y-1">
		<P class="font-semibold">{quantityTitle(scenario, index)}</P>
		{#if scenario.label && scenario.unitQuantity}<P class="text-sm"
				>{scenario.unitQuantity.toLocaleString('en-US')} units</P
			>{/if}
		<P class="text-sm"
			>{scenario.packageTotalCount ?? 'Unknown'}
			{scenario.handlingUnit === 'pallet'
				? scenario.packageTotalCount === 1
					? 'pallet'
					: 'pallets'
				: scenario.packageTotalCount === 1
					? 'carton'
					: 'cartons'} · {scenario.packageTotalWeight ?? 'Unknown'} lbs total</P
		>
		{#if scenario.casePacking}<P class="text-sm"
				>{scenario.casePacking.unitsPerCarton.toLocaleString('en-US')} units per {scenario.handlingUnit ===
				'pallet'
					? 'pallet'
					: 'case'} · {scenario.casePacking.cartonWeight} lbs per full {scenario.handlingUnit ===
				'pallet'
					? 'pallet'
					: 'case'}</P
			>{/if}
		{#each scenario.packageGroups ?? [] as group, index (index)}<P class="text-sm"
				>{group.quantity} @ {group.weight} lbs</P
			>{/each}
	</Div>
{/snippet}

<Modal title="Displayed columns" bind:isOpen={columnsOpen} class="w-full max-w-md space-y-4">
	<Div class="space-y-2">
		{#each detailColumns as column (typeof column === 'string' ? column : column.key)}
			{@const key = typeof column === 'string' ? column : column.key}
			<Checkbox
				label={typeof column === 'string' ? column : (column.label ?? key)}
				checked={!hiddenColumns.includes(key)}
				disabled={!hiddenColumns.includes(key) &&
					detailColumns.filter(
						(column) => !hiddenColumns.includes(typeof column === 'string' ? column : column.key)
					).length === 1}
				onchange={(event) => {
					hiddenColumns = event.currentTarget.checked
						? hiddenColumns.filter((value) => value !== key)
						: [...hiddenColumns, key];
				}}
			/>
		{/each}
	</Div>
	<DialogActions><Button onclick={() => (columnsOpen = false)}>Done</Button></DialogActions>
</Modal>
