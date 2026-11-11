<script lang="ts">
	import { Card, Div, H2, P, Table, Tabs, Tbody, Td, Th, Thead, Tr } from '$lib/components';
	import { currency } from '$lib/formats';
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
		return rate ? currency(rate.rate) : 'Unavailable';
	}
</script>

<Card class="min-w-0 space-y-4">
	<H2 class="text-lg">Rate comparison</H2>
	<Tabs
		aria-label="Rate table layout"
		bind:value={orientation}
		tabs={[
			{ title: 'Services as rows', value: 'services' },
			{ title: 'Quantities as rows', value: 'quantities' }
		]}
	/>
	<Div class="max-w-full overflow-x-auto">
		<Table class="w-full" aria-label="UPS rate comparison">
			<Thead>
				<Tr>
					<Th scope="col"
						>{orientation === 'services' ? 'Service / quantity' : 'Quantity / service'}</Th
					>
					{#if orientation === 'services'}
						{#each scenarios as scenario, index (scenario.id)}
							<Th scope="col">{@render quantity(scenario, index)}</Th>
						{/each}
					{:else}
						{#each services as code (code)}<Th scope="col" class="text-right whitespace-nowrap"
								>{serviceTitle(code)}</Th
							>{/each}
					{/if}
				</Tr>
			</Thead>
			<Tbody>
				{#if orientation === 'services'}
					{#each services as code (code)}
						<Tr
							><Th scope="row" class="whitespace-nowrap">{serviceTitle(code)}</Th>
							{#each scenarios as scenario (scenario.id)}<Td class="text-right whitespace-nowrap"
									>{rateValue(scenario, code)}</Td
								>{/each}
						</Tr>
					{/each}
				{:else}
					{#each scenarios as scenario, index (scenario.id)}
						<Tr
							><Th scope="row">{@render quantity(scenario, index)}</Th>
							{#each services as code (code)}<Td class="text-right whitespace-nowrap"
									>{rateValue(scenario, code)}</Td
								>{/each}
						</Tr>
					{/each}
				{/if}
			</Tbody>
		</Table>
	</Div>
	{#each scenarios as scenario, index (scenario.id)}
		{#if scenario.message}<P role={scenario.status === 'failed' ? 'alert' : 'status'}
				>{quantityTitle(scenario, index)}: {scenario.message}</P
			>{/if}
	{/each}
</Card>

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
