<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Button, Div, P, Select, Textarea } from '$lib/components';
	import type { SourceReference, SourceOption } from './types';
	import { dataRecord } from './workflows';
	let {
		value = $bindable(),
		sources = [],
		onError = () => {},
		onManage = () => {}
	}: {
		value?: SourceReference;
		sources?: SourceOption[];
		onError?: (message: string) => void;
		onManage?: () => void;
	} = $props();
	let error = $state('');
	onDestroy(() => onError(''));
</script>

<Div class="space-y-2">
	<Select
		label="Data source"
		aria-label="Reusable data source"
		value={value?.sourceId ?? ''}
		options={[
			{ value: '', label: 'No reusable source' },
			...sources.map((source) => ({ value: source.id, label: source.title })),
			...(value && !sources.some((source) => source.id === value!.sourceId)
				? [{ value: value.sourceId, label: 'Unavailable source' }]
				: [])
		]}
		onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
			error = '';
			onError('');
			const source = sources.find((item) => item.id === event.currentTarget.value);
			value = source
				? {
						sourceId: source.id,
						output: Object.keys(source.outputs)[0] ?? '',
						parameters: { ...source.parameters }
					}
				: undefined;
		}}
	/>
	{#if value}
		<Select
			label="Output"
			aria-label="Source output"
			bind:value={value.output}
			options={Object.keys(
				sources.find((source) => source.id === value!.sourceId)?.outputs ?? {}
			).map((output) => ({ value: output, label: output }))}
		/>
		<Textarea
			label="Source parameters (JSON)"
			aria-label="Source parameters"
			rows={3}
			value={JSON.stringify(value.parameters, null, 2)}
			oninput={(event) => {
				try {
					const params = dataRecord(JSON.parse(event.currentTarget.value));
					if (value) value.parameters = params;
					error = '';
					onError('');
				} catch (cause) {
					error = cause instanceof Error ? cause.message : 'Invalid parameters.';
					onError(error);
				}
			}}
		/>
	{/if}
	{#if error}<P role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</P>{/if}
	<Button variants={['ghost']} onclick={onManage}>Manage data links</Button>
</Div>
