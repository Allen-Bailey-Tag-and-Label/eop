<script lang="ts">
	import InspectorInput from './InspectorInput.svelte';
	import { Details, Div, Input, P, Select, Textarea } from '$lib/components';
	import { dataModels, validateLink } from './data-link';
	import type { SlideDataSource } from './types';
	let {
		link = $bindable(),
		fields = [],
		templateMode = false
	}: { link: SlideDataSource; fields?: string[]; templateMode?: boolean } = $props();
	const error = $derived.by(() => {
		try {
			validateLink(link, !templateMode);
			return '';
		} catch (cause) {
			return cause instanceof Error ? cause.message : 'Invalid data link.';
		}
	});
</script>

<Div class="flex flex-col gap-2">
	<Select
		label="Query mode"
		aria-label="Data query mode"
		value={link.mode ?? 'find'}
		onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
			(link.mode = event.currentTarget.value as 'find' | 'aggregate')}
		options={[
			{ value: 'find', label: 'Find' },
			{ value: 'aggregate', label: 'Aggregate' }
		]}
	/>
	<Select
		label="Model"
		aria-label="Data model"
		bind:value={link.model}
		options={[
			{ value: '', label: 'Choose a model' },
			...dataModels.map((value) => ({ value, label: value }))
		]}
	/>
	{#if fields.length}<Details
			><summary class="cursor-pointer text-[11px] font-medium">Available fields</summary><P
				class="text-xs break-words opacity-60"
				>Source fields: {fields.join(', ')}. {link.mode === 'aggregate'
					? 'Output fields can use aliases created by the pipeline.'
					: 'Mixed fields accept nested paths.'}</P
			></Details
		>{/if}
	{#if link.mode === 'aggregate'}
		<Textarea
			label="Pipeline (JSON array)"
			aria-label="Data pipeline"
			bind:value={link.pipeline}
			rows={12}
		/>
		<P class="text-xs opacity-60"
			>Use read-only stages: $match, $lookup, $unwind, $project, $set, $addFields, $group, $sort,
			$skip, $limit. Lookup from uses a model name (for example UserProfile), not a collection name.
			User exposes only _id, isActive, and _profileId. Joins expose explicit schema fields; hidden
			and unstructured fields are excluded.</P
		>
	{:else}
		<Textarea
			label="find — filter (JSON)"
			aria-label="Data filter"
			bind:value={link.filter}
			rows={5}
		/>
	{/if}
	<P class="text-xs opacity-60"
		>Relative dates: {JSON.stringify({ $date: 'today' })}, {JSON.stringify({ $date: 'today+30d' })},
		or {JSON.stringify({ $date: 'now' })}. Dates resolve each time the monitor fetches data.</P
	>
	<Input
		label={link.mode === 'aggregate'
			? 'Output fields (space separated)'
			: 'select — fields (space separated)'}
		aria-label="Data select"
		bind:value={link.select}
		placeholder="name date"
	/>
	<Textarea
		label="sort (JSON; 1 ascending, -1 descending)"
		aria-label="Data sort"
		bind:value={link.sort}
		rows={2}
	/>
	<Div class="grid grid-cols-2 gap-3">
		{#each ['skip', 'limit'] as field (field)}
			<InspectorInput
				label={field}
				prefix={field === 'skip' ? 'Skip' : 'Max'}
				aria-label={`Data ${field}`}
				type="number"
				min={field === 'limit' ? 1 : 0}
				max={field === 'limit' ? 100 : 10000}
				step={1}
				value={String(link[field as 'skip' | 'limit'])}
				oninput={(event) => (link[field as 'skip' | 'limit'] = Number(event.currentTarget.value))}
			/>
		{/each}
	</Div>
	{#if !templateMode}
		<Input label="Label field" aria-label="Data label field" bind:value={link.labelField} />
		<Input
			label="Detail field (optional)"
			aria-label="Data detail field"
			bind:value={link.detailField}
		/>
		<Select
			label="Detail format"
			bind:value={link.detailFormat}
			options={['text', 'date', 'number'].map((value) => ({ value, label: value }))}
		/>
	{/if}
	<Input label="Time zone" aria-label="Data time zone" bind:value={link.timeZone} />
	<Input label="Empty message" bind:value={link.emptyMessage} />
	{#if error}<P role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</P>{/if}
	<P class="text-xs opacity-60"
		>Selected display fields are published to monitors. Queries are read only; select explicit
		fields and use a limit.</P
	>
</Div>
