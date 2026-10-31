<script lang="ts">
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
		Td
	} from '$lib/components';

	import type { Column, TdSnippet } from '$lib/components/Datatable/types';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let selectedSlide = $state<PageProps['data']['slides'][number] | null>(null);
	let isDeleteOpen = $state(false);
	let managing = $state(false);
	let duplicatingId = $state<string | null>(null);
	const columns: Column[] = [
		{ key: 'title', label: 'Slide', type: 'string' },
		{ key: 'slug', label: 'Slug', type: 'string' },
		{ key: 'publishedAt', label: 'Published', type: 'string', snippet: publishedCell },
		{
			key: 'actions',
			label: 'Actions',
			snippet: editCell,
			isSortable: false,
			isFilterable: false,
			isExportable: false
		}
	];
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && !managing) isDeleteOpen = false;
	}}
/>

<Div class="space-y-6"
	><Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Monitor slides</H1><A
			href="/admin/monitors/slides/new"
			class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
			>Create slide</A
		></Div
	>
	<P>Create drafts, preview animation, and publish slides before adding them to a playlist.</P>
	{#if !isDeleteOpen && form?.error}<P role="alert" class="text-red-600 dark:text-red-400"
			>{form.error}</P
		>{/if}
	{#if form && 'success' in form}<P role="status">{form.success}</P>{/if}
	{#if data.slides.length}
		<Datatable
			{columns}
			rows={data.slides}
			isCreatable={false}
			isDeletable={false}
			isEditable={false}
			isExportable={false}
			isImportable={false}
			isSelectable={false}
			isColumnsReorderable={false}
		/>
	{:else}
		<Card><P>No slides yet. Create your first slide to get started.</P></Card>
	{/if}
</Div>

{#snippet publishedCell({ object }: TdSnippet)}
	<Td class="whitespace-nowrap"
		>{object.publishedAt ? new Date(object.publishedAt).toLocaleString() : 'Draft only'}</Td
	>
{/snippet}

{#snippet editCell({ object }: TdSnippet)}
	<Td class="whitespace-nowrap">
		<Div class="flex items-center gap-2">
			<A
				href={`/admin/monitors/slides/${object.slug}`}
				aria-label={`Edit ${object.title}`}
				class={twMerge(
					$theme.Button.default,
					$theme.Button.small,
					'inline-flex items-center hover:no-underline'
				)}>Edit</A
			>
			<Form
				action="?/duplicate"
				class="w-auto max-w-none space-y-0"
				submitFunction={({ cancel }) => {
					if (duplicatingId) {
						cancel();
						return;
					}
					duplicatingId = object.id;
					return async ({ update }) => {
						try {
							await update();
						} finally {
							duplicatingId = null;
						}
					};
				}}
			>
				<Input type="hidden" name="id" value={object.id} />
				<Input type="hidden" name="version" value={String(object.version)} />
				<Button
					type="submit"
					disabled={!!duplicatingId || managing}
					variants={['small', 'contrast']}
					aria-label={`Duplicate ${object.title}`}>Duplicate</Button
				>
			</Form>
			<Button
				disabled={!!duplicatingId || managing}
				variants={['small', 'error']}
				aria-label={`Delete ${object.title}`}
				onclick={() => {
					selectedSlide = object;
					form = null;
					isDeleteOpen = true;
				}}>Delete</Button
			>
		</Div>
	</Td>
{/snippet}

<Modal
	title="Delete slide?"
	titleId="delete-slide-title"
	bind:isOpen={isDeleteOpen}
	role="dialog"
	aria-modal="true"
	aria-labelledby="delete-slide-title"
	class="w-full max-w-lg space-y-4"
>
	{#if selectedSlide}
		<P
			>Permanently delete “{selectedSlide.title}” and its draft and published content? Uploaded
			assets will remain available. Slides used by playlists cannot be deleted.</P
		>
		{#if form?.error}
			<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>
			{#if 'references' in form}{#each form.references as reference (reference.slug)}<P
						><A href={`/admin/monitors/playlists/${reference.slug}`}>{reference.title}</A></P
					>{/each}{/if}
		{/if}
		<Form
			action="?/delete"
			class="w-full max-w-none space-y-4"
			submitFunction={() => {
				managing = true;
				return async ({ update, result }) => {
					try {
						await update();
						if (result.type === 'success') isDeleteOpen = false;
					} finally {
						managing = false;
					}
				};
			}}
		>
			<Input type="hidden" name="id" value={selectedSlide.id} />
			<Input type="hidden" name="slug" value={selectedSlide.slug} />
			<Input type="hidden" name="version" value={String(selectedSlide.version)} />
			<Input type="hidden" name="confirm" value="delete" />
			{#snippet buttons()}<DialogActions>
					<Button variants={['contrast']} onclick={() => (isDeleteOpen = false)}>Cancel</Button>
					<Button type="submit" variants={['error']} disabled={managing}>Delete slide</Button>
				</DialogActions>{/snippet}
		</Form>
	{/if}
</Modal>
