<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		A,
		Button,
		Card,
		Datatable,
		DialogActions,
		Div,
		Form,
		H1,
		Input,
		Modal,
		P,
		Tabs,
		Td
	} from '$lib/components';
	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import type { MarkupRange, ShippingService } from '$lib/shipping/types';
	import { currency } from '$lib/formats';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let service = $state<ShippingService>('UPS');
	const config = $derived(data.configs.find((entry) => entry.service === service)!);
	type Editor = {
		id: string;
		label: string;
		minimum: string;
		maximum: string;
		percent: string;
		service: ShippingService;
		revision: number;
		editing: boolean;
	};
	let editor = $state<Editor | null>(null);
	let deleting = $state<{
		id: string;
		label: string;
		service: ShippingService;
		revision: number;
	} | null>(null);
	let saving = $state(false);
	function openEditor(range?: MarkupRange) {
		form = null;
		editor = {
			id: range?.id ?? crypto.randomUUID(),
			label: range?.label ?? '',
			minimum: ((range?.minCents ?? 0) / 100).toFixed(2),
			maximum: range?.maxCents == null ? '' : (range.maxCents / 100).toFixed(2),
			percent: ((range?.percentBps ?? 0) / 100).toFixed(2),
			service,
			revision: config.revision,
			editing: !!range
		};
	}
	const columns: Column[] = [
		{ key: 'label', label: 'Rule', type: 'string' },
		{ key: 'minCents', label: 'Freight cost range', snippet: rangeCell },
		{ key: 'percentBps', label: 'Markup', snippet: percentCell },
		{
			key: 'actions',
			label: 'Actions',
			snippet: actionsCell,
			isSortable: false,
			isFilterable: false
		}
	];
</script>

<svelte:head><title>Shipping markups - EOP</title></svelte:head>
<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Shipping markups</H1><A
			href="/shipping/quote"
			class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
			>Create quote</A
		></Div
	>
	<P
		>Apply a percentage to the provider's total freight cost in USD. UPS and LTL have separate
		rules. A cost without a matching range uses 0% markup. Existing quotes retain their saved
		prices.</P
	>
	<Tabs
		tabs={[
			{ title: 'UPS', value: 'UPS' },
			{ title: 'LTL', value: 'LTL' }
		]}
		bind:value={service}
		aria-label="Shipping markup service"
	/>
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><P>{service} rules · Revision {config.revision}</P><Button onclick={() => openEditor()}
			>Add markup range</Button
		></Div
	>
	{#if !editor && !deleting && form?.error}<P role="alert" class="text-red-600 dark:text-red-400"
			>{form.error}</P
		>{/if}
	{#if form && 'success' in form}<P role="status">{form.success}</P>{/if}
	{#if config.ranges.length}<Datatable
			{columns}
			rows={config.ranges}
			isCreatable={false}
			isEditable={false}
			isDeletable={false}
			isExportable={false}
			isImportable={false}
			isSelectable={false}
			isColumnsReorderable={false}
		/>{:else}<Card
			><P>No {service} markup ranges yet. All {service} quotes currently use 0% markup.</P></Card
		>{/if}
</Div>
{#snippet rangeCell({ object }: TdSnippet)}<Td
		>{currency(object.minCents / 100)} inclusive – {object.maxCents === null
			? 'No upper limit'
			: `${currency(object.maxCents / 100)} exclusive`}</Td
	>{/snippet}
{#snippet percentCell({ object }: TdSnippet)}<Td>{object.percentBps / 100}%</Td>{/snippet}
{#snippet actionsCell({ object }: TdSnippet)}<Td
		><Div class="flex items-center gap-2"
			><Button variants={['small']} onclick={() => openEditor(object)}>Edit</Button><Button
				variants={['small', 'error']}
				onclick={() => {
					form = null;
					deleting = { id: object.id, label: object.label, service, revision: config.revision };
				}}>Delete</Button
			></Div
		></Td
	>{/snippet}

<Modal
	title={editor?.editing ? 'Edit markup range' : 'Add markup range'}
	titleId="shipping-markup-title"
	isOpen={!!editor}
	onDismiss={() => (editor = null)}
	class="w-full max-w-xl space-y-4"
	aria-labelledby="shipping-markup-title"
>
	{#if editor}
		<Form
			action="?/save"
			class="w-full max-w-none space-y-4"
			submitFunction={() => {
				saving = true;
				return async ({ update, result }) => {
					try {
						await update({ reset: false });
						if (result.type === 'success') editor = null;
						else if (result.type === 'failure' && result.status === 409) await invalidateAll();
					} finally {
						saving = false;
					}
				};
			}}
		>
			{#each ['id', 'service', 'revision', 'editing'] as key (key)}<Input
					type="hidden"
					name={key}
					value={String(editor[key as keyof Editor])}
				/>{/each}
			<P
				>{editor.service} · Minimum is inclusive; maximum is exclusive. Leave maximum empty for no upper
				limit.</P
			>
			<Input label="Rule label" name="label" bind:value={editor.label} maxlength={100} required />
			<Div class="grid gap-4 sm:grid-cols-2"
				><Input
					label="Minimum freight cost ($)"
					type="number"
					name="minimum"
					value={editor.minimum}
					oninput={(event) => {
						if (editor) editor.minimum = event.currentTarget.value;
					}}
					min={0}
					step={0.01}
					required
				/><Input
					label="Maximum freight cost ($)"
					type="number"
					name="maximum"
					value={editor.maximum}
					oninput={(event) => {
						if (editor) editor.maximum = event.currentTarget.value;
					}}
					min={0}
					step={0.01}
				/></Div
			>
			<Input
				label="Markup (%)"
				type="number"
				name="percent"
				value={editor.percent}
				oninput={(event) => {
					if (editor) editor.percent = event.currentTarget.value;
				}}
				min={0}
				max={1000}
				step={0.01}
				required
			/>
			{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
			{#snippet buttons()}<DialogActions
					><Button variants={['contrast']} onclick={() => (editor = null)}>Cancel</Button><Button
						type="submit"
						disabled={saving}>{saving ? 'Saving…' : 'Save rule'}</Button
					></DialogActions
				>{/snippet}
		</Form>
	{/if}
</Modal>
<Modal
	title="Delete markup range?"
	titleId="delete-shipping-markup-title"
	isOpen={!!deleting}
	onDismiss={() => (deleting = null)}
	class="w-full max-w-lg space-y-4"
	aria-labelledby="delete-shipping-markup-title"
>
	{#if deleting}
		<P
			>Delete “{deleting.label}” from {deleting.service}? Costs in this range will use 0% markup
			unless another rule covers them. Saved quotes will retain their prices.</P
		>
		{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
		<Form
			action="?/delete"
			class="w-full max-w-none space-y-4"
			submitFunction={() => {
				saving = true;
				return async ({ update, result }) => {
					try {
						await update();
						if (result.type === 'success') deleting = null;
						else if (result.type === 'failure' && result.status === 409) await invalidateAll();
					} finally {
						saving = false;
					}
				};
			}}
		>
			<Input type="hidden" name="id" value={deleting.id} /><Input
				type="hidden"
				name="service"
				value={deleting.service}
			/><Input type="hidden" name="revision" value={String(deleting.revision)} />
			{#snippet buttons()}<DialogActions
					><Button variants={['contrast']} onclick={() => (deleting = null)}>Cancel</Button><Button
						type="submit"
						variants={['error']}
						disabled={saving}>Delete range</Button
					></DialogActions
				>{/snippet}
		</Form>
	{/if}
</Modal>
