<script lang="ts">
	import { Datatable, Details, Div, P, Summary, Tabs, Td } from '$lib/components';
	import { currency } from '$lib/formats';
	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import { UPS_SERVICES, type QuoteScenario } from './quote';

	type Props = { scenarios: QuoteScenario[] };
	let { scenarios }: Props = $props();
	let orientation = $state<'services' | 'quantities'>('services');
	const services = $derived.by(() => {
		const selected = new Set(scenarios.flatMap((scenario) => scenario.services));
		return [
			...UPS_SERVICES.map((service) => service.code).filter((code) => selected.has(code)),
			...Array.from(selected).filter(
				(code) => !UPS_SERVICES.some((service) => service.code === code)
			)
		];
	});
	const serviceTitle = (code: string) =>
		UPS_SERVICES.find((service) => service.code === code)?.title ?? code;
	const quantityTitle = (scenario: QuoteScenario, index: number) =>
		scenario.label ||
		(scenario.unitQuantity
			? `${scenario.unitQuantity.toLocaleString('en-US')} units`
			: `Rate row ${index + 1}`);
	function rateValue(scenario: QuoteScenario, code: string) {
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
	const optionTitle = (scenario: QuoteScenario, index: number) =>
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
</script>

<Div class="min-w-0 space-y-4" role="region" aria-label="UPS rate comparison">
	<Div class="min-w-0">
		<Tabs
			class="gap-0 rounded-b-none p-0 [&_button]:rounded-b-none"
			aria-label="Rate table layout"
			bind:value={orientation}
			tabs={[
				{ title: 'Services as rows', value: 'services' },
				{ title: 'Quantities as rows', value: 'quantities' }
			]}
		/>
		{#key orientation}
			<Datatable
				class="rounded-t-none"
				{columns}
				{rows}
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
	<Details>
		<Summary>Packing details</Summary>
		<Div class="grid gap-4 pt-4 sm:grid-cols-2">
			{#each scenarios as scenario, index (scenario.id)}{@render quantity(scenario, index)}{/each}
		</Div>
	</Details>
	{#each scenarios as scenario, index (scenario.id)}
		{#if scenario.message}<P role={scenario.status === 'failed' ? 'alert' : 'status'}
				>{quantityTitle(scenario, index)}: {scenario.message}</P
			>{/if}
	{/each}
</Div>

{#snippet rateCell({ key, object }: TdSnippet)}
	<Td class="text-right whitespace-nowrap">{formatRate(object[key])}</Td>
{/snippet}

{#snippet quantity(scenario: QuoteScenario, index: number)}
	<Div class="min-w-40 space-y-1">
		<P class="font-semibold">{quantityTitle(scenario, index)}</P>
		{#if scenario.label && scenario.unitQuantity}<P class="text-sm"
				>{scenario.unitQuantity.toLocaleString('en-US')} units</P
			>{/if}
		<P class="text-sm"
			>{scenario.packageTotalCount}
			{scenario.packageTotalCount === 1 ? 'carton' : 'cartons'} · {scenario.packageTotalWeight} lbs total</P
		>
		{#if scenario.casePacking}<P class="text-sm"
				>{scenario.casePacking.unitsPerCarton.toLocaleString('en-US')} units per case · {scenario
					.casePacking.cartonWeight} lbs per full case</P
			>{/if}
		{#each scenario.packageGroups as group, index (index)}<P class="text-sm"
				>{group.quantity} @ {group.weight} lbs</P
			>{/each}
	</Div>
{/snippet}
