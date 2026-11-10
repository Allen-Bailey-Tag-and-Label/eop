<script lang="ts">
	import { A, Button, Card, Datatable, Div, Form, H1, Input, P, Td } from '$lib/components';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const columns: Column[] = [
		{ key: 'number', label: 'Quote', type: 'string' },
		{ key: 'createdAt', label: 'Created', snippet: dateCell },
		{ key: 'services', label: 'Services', type: 'string' },
		{ key: 'customer', label: 'Customer', type: 'string' },
		{ key: 'reference', label: 'Reference', type: 'string' },
		{ key: 'destination', label: 'Destination', type: 'string' },
		{ key: 'status', label: 'Status', type: 'string' },
		{ key: 'actions', label: 'Actions', snippet: actionsCell }
	];
	const pageUrl = (page: number) =>
		`/shipping/quotes?${new URLSearchParams({ page: String(page), q: data.search })}`;
</script>

<svelte:head><title>Shipping quotes - EOP</title></svelte:head>
<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Shipping quotes</H1><A
			href="/shipping/quote"
			class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
			>Create quote</A
		></Div
	>
	<P>New shipping quotes and historical UPS quotes. Legacy prices remain exactly as saved.</P>
	<Form method="GET" class="flex max-w-none flex-wrap items-end gap-4 space-y-0"
		><Input
			label="Search quote, customer, reference, or destination"
			name="q"
			value={data.search}
			maxlength={100}
		/><Button type="submit">Search</Button></Form
	>
	{#if data.quotes.length}
		<Datatable
			{columns}
			rows={data.quotes}
			isCreatable={false}
			isDeletable={false}
			isEditable={false}
			isExportable={false}
			isImportable={false}
			isSelectable={false}
			isColumnsReorderable={false}
			isPaginateable={false}
			isSortable={false}
			isFilterable={false}
		/>
	{:else}<Card><P>No quotes found.</P></Card>{/if}
	<Div class="flex flex-wrap items-center justify-between gap-4">
		<P
			>{data.total} quotes · Page {data.page} of {Math.max(
				1,
				Math.ceil(data.total / data.pageSize)
			)}</P
		>
		<Div class="flex items-center gap-2">
			{#if data.page > 1}<A
					href={pageUrl(data.page - 1)}
					class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
					>Previous</A
				>{:else}<Button disabled>Previous</Button>{/if}
			{#if data.page * data.pageSize < data.total}<A
					href={pageUrl(data.page + 1)}
					class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
					>Next</A
				>{:else}<Button disabled>Next</Button>{/if}
		</Div>
	</Div>
</Div>
{#snippet dateCell({ object }: TdSnippet)}<Td class="whitespace-nowrap"
		>{object.createdAt ? new Date(object.createdAt).toLocaleString() : 'Unknown'}</Td
	>{/snippet}
{#snippet actionsCell({ object }: TdSnippet)}<Td
		><A
			href={`/shipping/quotes/${object.number}`}
			class={twMerge(
				$theme.Button.default,
				$theme.Button.small,
				'inline-flex items-center hover:no-underline'
			)}>View</A
		></Td
	>{/snippet}
