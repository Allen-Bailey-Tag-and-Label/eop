<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { Button, Div, Input, Select, Textarea, P } from '$lib/components';
	import {
		chartKinds,
		validateChart,
		type ChartDefinition
	} from '$lib/components/Chart/definition';
	import ColorField from './ColorField.svelte';
	import type { ColorScheme } from './types';
	let {
		settings = $bindable(),
		scheme,
		linked = false,
		onError = () => {}
	}: {
		settings: ChartDefinition;
		scheme: ColorScheme;
		linked?: boolean;
		onError?: (message: string) => void;
	} = $props();
	let rows = $state(untrack(() => JSON.stringify(settings.rows, null, 2)));
	let error = $state('');
	onDestroy(() => onError(''));
	$effect(() => {
		onError(linked ? '' : error);
	});
	function updateRows(event: Event & { currentTarget: HTMLTextAreaElement }) {
		rows = event.currentTarget.value;
		try {
			const next = validateChart({ ...settings, rows: JSON.parse(rows) });
			settings.rows = next.rows;
			error = '';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Invalid chart rows.';
		}
	}
	const compact = 'h-8 min-w-0 rounded-md px-2 py-1 text-xs';
</script>

<Div class="space-y-3">
	<Select
		label="Chart type"
		aria-label="Chart type"
		class={compact}
		bind:value={settings.kind}
		options={chartKinds.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))}
	/>
	<Input
		label="Chart label size"
		aria-label="Chart label size"
		class={compact}
		type="number"
		min={8}
		max={80}
		value={String(settings.fontSize)}
		oninput={(event) => (settings.fontSize = event.currentTarget.valueAsNumber)}
	/>
	<Div class="grid grid-cols-2 gap-2">
		<Input
			label="X / category field"
			aria-label="Chart X field"
			class={compact}
			bind:value={settings.xField}
		/>
		<Select
			label="X values"
			aria-label="Chart X type"
			class={compact}
			bind:value={settings.xType}
			options={['category', 'number', 'date'].map((value) => ({ value, label: value }))}
		/>
	</Div>
	{#each settings.series as series, index (index)}
		<Div class="space-y-2">
			<Div class="grid grid-cols-2 gap-2"
				><Input
					label={`Series ${index + 1} field`}
					aria-label={`Chart series ${index + 1} field`}
					class={compact}
					bind:value={series.field}
				/><Input
					label="Legend label"
					aria-label={`Chart series ${index + 1} label`}
					class={compact}
					bind:value={series.label}
				/></Div
			>
			<Div class="flex items-center gap-2"
				><Div class="min-w-0 flex-1"
					><ColorField
						compact
						label="Series color"
						ariaLabel={`Chart series ${index + 1} color`}
						value={series.color}
						{scheme}
						onValueChange={(value) => (series.color = value)}
					/></Div
				><Button
					variants={['ghost']}
					class="h-8 px-2 py-1 text-xs"
					disabled={settings.series.length === 1}
					onclick={() => settings.series.splice(index, 1)}>Remove series</Button
				></Div
			>
		</Div>
	{/each}
	<Button
		variants={['ghost']}
		class="h-8 px-2 py-1 text-xs"
		disabled={settings.series.length >= 12}
		onclick={() =>
			settings.series.push({
				field: `value${settings.series.length + 1}`,
				label: `Series ${settings.series.length + 1}`,
				color: { light: '#059669', dark: '#34d399' }
			})}>Add series</Button
	>
	<Select
		aria-label="Chart legend"
		class={compact}
		value={String(settings.legend)}
		options={[
			{ value: 'true', label: 'Legend: on' },
			{ value: 'false', label: 'Legend: off' }
		]}
		onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
			(settings.legend = event.currentTarget.value === 'true')}
	/>
	{#if settings.kind === 'pie' || settings.kind === 'arc'}
		<P class="text-xs opacity-60"
			>Each row is a category. Pie and arc charts use the first numeric series.</P
		>
		<Div class="grid grid-cols-2 gap-2"
			>{#each settings.palette as color, index (index)}<ColorField
					compact
					label={`Category ${index + 1}`}
					ariaLabel={`Chart category color ${index + 1}`}
					value={color}
					{scheme}
					onValueChange={(value) => (settings.palette[index] = value)}
				/>{/each}</Div
		>
		<Input
			label="Inner radius (0 to 0.9)"
			aria-label="Chart inner radius"
			class={compact}
			type="number"
			min={0}
			max={0.9}
			step={0.05}
			value={String(settings.innerRadius)}
			oninput={(event) => (settings.innerRadius = event.currentTarget.valueAsNumber)}
		/>
	{:else}
		{#if settings.kind === 'bar'}<Select
				label="Bar orientation"
				aria-label="Chart orientation"
				class={compact}
				bind:value={settings.orientation}
				options={['vertical', 'horizontal'].map((value) => ({ value, label: value }))}
			/>{/if}
		<Div class="grid grid-cols-2 gap-2">
			{#each ['axis', 'grid', ...(['line', 'area'].includes(settings.kind) ? ['points'] : []), ...(['bar', 'area'].includes(settings.kind) ? ['stacked'] : [])] as option (option)}
				{@const key = option as 'axis' | 'grid' | 'legend' | 'points' | 'stacked'}
				<Select
					aria-label={`Chart ${key}`}
					class={compact}
					value={String(settings[key])}
					options={[
						{ value: 'true', label: `${key}: on` },
						{ value: 'false', label: `${key}: off` }
					]}
					onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
						(settings[key] = event.currentTarget.value === 'true')}
				/>
			{/each}
		</Div>
	{/if}
	{#if linked}<P class="text-xs opacity-60"
			>Rows come from the selected data-link output. Use the output's field names above. Queries and
			API settings remain in Data.</P
		>
	{:else}<Textarea
			label="Chart rows (JSON)"
			aria-label="Chart rows JSON"
			rows={7}
			value={rows}
			oninput={updateRows}
		/><P class="text-xs opacity-60"
			>Use flat records with numeric series values. Select a data link below for live data.</P
		>{/if}
	{#if error}<P role="alert" class="text-xs text-red-600 dark:text-red-400">{error}</P>{/if}
</Div>
