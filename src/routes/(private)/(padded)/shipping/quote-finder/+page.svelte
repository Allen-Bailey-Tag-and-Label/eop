<script lang="ts">
	import { A, Div, MongooseTable, Td } from '$lib/components';
	import type { TdSnippet } from '$lib/components/Datatable/types';
	import type { ColumnOverrides } from '$lib/components/MongooseTable/types';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import { duplicateShippingQuoteUrl } from '$lib/shipping/finder';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let columnOverrides = $state<ColumnOverrides>({
		_branchId: { label: 'Branch' },
		number: { label: 'Quote' }
	});
</script>

<svelte:head><title>Shipping quote finder - EOP</title></svelte:head>
<MongooseTable
	{data}
	bind:columnOverrides
	isCreatable={false}
	isDeletable={false}
	isEditable={false}
	modelName="ShippingQuote"
	virtualColumns={[
		{
			key: 'buttons',
			label: '',
			class: 'w-0',
			isFilterable: false,
			isSortable: false,
			isExportable: false,
			snippet: buttonsSnippet
		}
	]}
/>

{#snippet buttonsSnippet({ object }: TdSnippet)}
	<Td class="py-0">
		<Div class="flex space-x-2">
			<A
				class={twMerge($theme.Button.default, $theme.Button.small, 'backdrop-blur-none')}
				href={duplicateShippingQuoteUrl(object)}>Duplicate</A
			>
			<A
				class={twMerge($theme.Button.default, $theme.Button.small, 'backdrop-blur-none')}
				href={`/shipping/quotes/${object.number}`}>View</A
			>
		</Div>
	</Td>
{/snippet}
