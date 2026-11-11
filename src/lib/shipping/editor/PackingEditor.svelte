<script lang="ts">
	import RateStrategies from '$lib/ups/RateStrategies.svelte';
	import PackingRow from './PackingRow.svelte';
	import { blankShippingScenario, type ShippingScenarioInput } from '../packing';
	import type { QuoteServices } from '../types';
	let {
		rows = $bindable([]),
		services
	}: { rows?: ShippingScenarioInput[]; services: QuoteServices } = $props();
	function createRow() {
		const row = blankShippingScenario(services);
		if (rows[0]?.shipping)
			row.shipping = { ...structuredClone($state.snapshot(rows[0].shipping)), shapes: {} };
		if (services !== 'Both') row.shipping!.basis = services;
		return row;
	}
	function copyRow(value: ShippingScenarioInput) {
		const row = structuredClone($state.snapshot(value));
		row.id = crypto.randomUUID();
		const shapes = row.shipping?.shapes ?? {};
		if (row.shipping) row.shipping.shapes = {};
		row.groups = row.groups.map((group) => {
			const id = crypto.randomUUID();
			if (shapes[group.id]) row.shipping!.shapes![id] = shapes[group.id];
			return { ...group, id };
		});
		return row;
	}
</script>

<RateStrategies
	bind:rows
	{createRow}
	{copyRow}
	showServices={services !== 'LTL'}
	freight={services === 'LTL' || rows[0]?.shipping?.basis === 'LTL'}
	fieldName="shippingScenarios"
>
	{#snippet packageFields(row, index)}<PackingRow
			bind:row={() => row as ShippingScenarioInput, (value) => (rows[index] = value)}
			{index}
			{services}
		/>{/snippet}
</RateStrategies>
