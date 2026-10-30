<script lang="ts">
	import { Div, Input, P, Select } from '$lib/components';
	import SourcePicker from '$lib/data/SourcePicker.svelte';
	import type { SourceOption } from '$lib/data/types';
	import type { RepeatItems } from './types';
	let {
		value = $bindable<RepeatItems>({ mode: 'count', count: 3 }),
		sources = [],
		onManage = () => {},
		onError = () => {}
	}: {
		value?: RepeatItems;
		sources?: SourceOption[];
		onManage?: () => void;
		onError?: (message: string) => void;
	} = $props();
</script>

<Div class="space-y-2">
	<Select
		label="Items"
		aria-label="Repeat items"
		value={value.mode}
		options={[
			{ value: 'count', label: 'Fixed count' },
			{ value: 'source', label: 'Data-link output' }
		]}
		onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
			onError('');
			value =
				event.currentTarget.value === 'count' ? { mode: 'count', count: 3 } : { mode: 'source' };
		}}
	/>
	{#if value.mode === 'count'}
		<Input
			label="Copies"
			aria-label="Repeat count"
			type="number"
			min={0}
			max={500}
			step={1}
			value={String(value.count)}
			oninput={(event) => {
				if (value.mode === 'count') value.count = event.currentTarget.valueAsNumber;
			}}
		/>
	{:else}
		<SourcePicker bind:value={value.source} {sources} {onManage} {onError} />
	{/if}
	<P class="text-xs opacity-60"
		>The repeater controls copies and layout. Edit queries and API configuration in the Data dialog;
		bind item properties to the current row.</P
	>
</Div>
