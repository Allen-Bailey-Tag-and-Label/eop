<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { A, MongooseTable, Td } from '$lib/components';
	import type { TdSnippet } from '$lib/components/MongooseTable/types.js';
	import { percent } from '$lib/formats';
	import { theme } from '$lib/theme';

	let { data } = $props();
	const columnOverrides = {
		_branchId: { label: 'Branch' }
	};
	const humanDate = (date: Date) => {
		if (isNaN(date.getTime())) return '';
		const { format } = new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric'
		});

		return format(date);
	};
</script>

<MongooseTable
	{data}
	{columnOverrides}
	isCreatable={false}
	isDeletable={false}
	isEditable={false}
	modelName="QuoteMarginCalculation"
	virtualColumns={[
		{ key: 'buttons', label: '', snippet: buttonsSnippet },
		{ key: 'previous.number', label: 'Previous Quote #', type: 'number' },
		{ key: 'previous.date', label: 'Previous Date', snippet: dateSnippet, type: 'timestamp' },
		{
			key: 'previous.margin',
			label: 'Previous Margin %',
			snippet: percentSnippet,
			type: 'number'
		},
		{ key: 'previous.sell', label: 'Previous Sell', type: 'currency' },
		{ key: 'current.number', label: 'Current Quote #', type: 'number' },
		{ key: 'current.date', label: 'Current Date', snippet: dateSnippet, type: 'timestamp' },
		{ key: 'current.margin', label: 'Current Margin %', snippet: percentSnippet, type: 'number' },
		{ key: 'current.sell', label: 'Current Sell', type: 'currency' }
	]}
/>

{#snippet buttonsSnippet({ object }: TdSnippet)}
	<Td class="py-0">
		<A
			class={twMerge($theme.Button.default, $theme.Button.small)}
			href="/quote/calculate-margin/quote/{object?.current?.number}"
		>
			View
		</A>
	</Td>
{/snippet}
{#snippet dateSnippet({ key, object }: TdSnippet)}
	{@const virtualKey = key.split('.')[0]}
	<Td class="text-right">
		{humanDate(new Date(object?.[virtualKey]?.date))}
	</Td>
{/snippet}
{#snippet percentSnippet({ key, object }: TdSnippet)}
	{@const virtualKey = key.split('.')[0]}
	{@const margin =
		(object?.[virtualKey]?.sell - object?.[virtualKey]?.totalCost) / object?.[virtualKey]?.sell}
	<Td class={twMerge('text-right', margin < 0 ? 'bg-red-500 text-white' : undefined)}>
		{percent(margin)}
	</Td>
{/snippet}
