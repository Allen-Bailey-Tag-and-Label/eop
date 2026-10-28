<script lang="ts">
	import { Div, Input, P, Select, Textarea } from '$lib/components';
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

<Div class="flex flex-col gap-3">
	<P class="text-sm font-semibold">Data link</P>
	<Select
		label="Model"
		aria-label="Data model"
		bind:value={link.model}
		options={[
			{ value: '', label: 'Choose a model' },
			...dataModels.map((value) => ({ value, label: value }))
		]}
	/>
	{#if fields.length}<P class="text-xs break-words opacity-60"
			>Available fields: {fields.join(', ')}. Mixed fields accept nested paths.</P
		>{/if}
	<Textarea
		label="find — filter (JSON)"
		aria-label="Data filter"
		bind:value={link.filter}
		rows={5}
	/>
	<P class="text-xs opacity-60"
		>Relative dates: {JSON.stringify({ $date: 'today' })}, {JSON.stringify({ $date: 'today+30d' })},
		or {JSON.stringify({ $date: 'now' })}. Dates resolve each time the monitor fetches data.</P
	>
	<Input
		label="select — fields (space separated)"
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
			<Input
				label={field}
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
