<script lang="ts">
	import {
		A,
		Button,
		Card,
		Datatable,
		Div,
		Form,
		H1,
		H2,
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
	let selectedPlaylist = $state<PageProps['data']['playlists'][number] | null>(null);
	let isDeleteOpen = $state(false);
	let managing = $state(false);
	let duplicatingId = $state<string | null>(null);
	const columns: Column[] = [
		{ key: 'title', label: 'Playlist', type: 'string' },
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
		><H1>Monitor playlists</H1><A href="/admin/monitors/playlists/new">Create playlist</A></Div
	>
	<P
		>Choose slide order and durations, publish, then assign a playlist to a monitor in Monitor
		management.</P
	>
	{#if !isDeleteOpen && form?.error}<P role="alert" class="text-red-600 dark:text-red-400"
			>{form.error}</P
		>{/if}
	{#if form && 'success' in form}<P role="status">{form.success}</P>{/if}
	{#if data.playlists.length}
		<Datatable
			{columns}
			rows={data.playlists}
			isCreatable={false}
			isDeletable={false}
			isEditable={false}
			isExportable={false}
			isImportable={false}
			isSelectable={false}
			isColumnsReorderable={false}
		/>
	{:else}
		<Card><P>No playlists yet. Publish slides, then create a playlist.</P></Card>
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
				href={`/admin/monitors/playlists/${object.slug}`}
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
					selectedPlaylist = object;
					form = null;
					isDeleteOpen = true;
				}}>Delete</Button
			>
		</Div>
	</Td>
{/snippet}

<Modal
	bind:isOpen={isDeleteOpen}
	isCloseable={!managing}
	role="dialog"
	aria-modal="true"
	aria-labelledby="delete-playlist-title"
	class="w-full max-w-lg space-y-4"
>
	{#if selectedPlaylist}
		<H2 id="delete-playlist-title">Delete playlist?</H2>
		<P
			>Permanently delete “{selectedPlaylist.title}” and its draft and published playlist? Its
			slides and uploaded assets will remain. Playlists assigned to approved monitors cannot be
			deleted.</P
		>
		{#if form?.error}
			<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>
			{#if 'monitors' in form && form.monitors.length}
				{#each form.monitors as monitor (monitor.id)}<P>{monitor.location || 'Unnamed monitor'}</P
					>{/each}
				<A href="/admin/monitors/management">Open Monitor management</A>
			{/if}
		{/if}
		<Form
			action="?/delete"
			class="max-w-none space-y-4"
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
			<Input type="hidden" name="id" value={selectedPlaylist.id} />
			<Input type="hidden" name="slug" value={selectedPlaylist.slug} />
			<Input type="hidden" name="version" value={String(selectedPlaylist.version)} />
			<Input type="hidden" name="confirm" value="delete" />
			{#snippet buttons()}
				<Button variants={['contrast']} disabled={managing} onclick={() => (isDeleteOpen = false)}
					>Cancel</Button
				>
				<Button type="submit" variants={['error']} disabled={managing}>Delete playlist</Button>
			{/snippet}
		</Form>
	{/if}
</Modal>
