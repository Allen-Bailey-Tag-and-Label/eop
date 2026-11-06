<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { GripVertical, Trash2 } from '@lucide/svelte';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import {
		A,
		Button,
		Card,
		Checkbox,
		DialogActions,
		Div,
		Form,
		H1,
		Input,
		Modal,
		P,
		Select
	} from '$lib/components';
	import type { ContentEditor, PlaylistDefinition, PlaylistItem } from './types';
	import PlaylistTransitionFields from './PlaylistTransitionFields.svelte';
	import PlaylistTransitionPreview from './PlaylistTransitionPreview.svelte';
	import { defaultPlaylistTransition } from './types';
	import { withPlaylistDefaults } from './playlist-transitions';
	let {
		data,
		form
	}: {
		data: {
			playlist: ContentEditor<PlaylistDefinition>;
			slides: { id: string; title: string; publishedAt: string | null }[];
		};
		form?: { error?: string; success?: string } | null;
	} = $props();
	let draft = $state(
		untrack(() => withPlaylistDefaults(structuredClone($state.snapshot(data.playlist.draft))))
	);
	let title = $state(untrack(() => data.playlist.title));
	let slug = $state(untrack(() => data.playlist.slug));
	let saving = $state(false);
	function move(index: number, offset: number) {
		const next = index + offset;
		if (next < 0 || next >= draft.items.length) return;
		[draft.items[index], draft.items[next]] = [draft.items[next], draft.items[index]];
	}
	let draggedItem = $state<PlaylistItem | null>(null);
	let dropTarget = $state<{ item: PlaylistItem; after: boolean } | null>(null);
	let announcement = $state('');
	function clearDrag() {
		draggedItem = null;
		dropTarget = null;
	}
	function dragStart(event: DragEvent, item: PlaylistItem) {
		if (
			event.target instanceof Element &&
			event.target.closest('input, select, button') &&
			!event.target.closest('[data-playlist-drag-handle]')
		) {
			event.preventDefault();
			return;
		}
		draggedItem = item;
		dropTarget = null;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', String(draft.items.indexOf(item)));
		}
	}
	function dragOver(event: DragEvent, item: PlaylistItem) {
		if (!draggedItem || draggedItem === item || !draft.items.includes(draggedItem)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		dropTarget = { item, after: event.clientY >= bounds.top + bounds.height / 2 };
	}
	function drop(event: DragEvent, item: PlaylistItem) {
		if (!draggedItem || draggedItem === item) {
			clearDrag();
			return;
		}
		event.preventDefault();
		const from = draft.items.indexOf(draggedItem);
		const to = draft.items.indexOf(item);
		if (from < 0 || to < 0) {
			clearDrag();
			return;
		}
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		let next = to + (event.clientY >= bounds.top + bounds.height / 2 ? 1 : 0);
		if (from < next) next--;
		const [entry] = draft.items.splice(from, 1);
		draft.items.splice(next, 0, entry);
		announcement = 'Moved slide ' + (from + 1) + ' to position ' + (next + 1) + '.';
		clearDrag();
	}
	const uid = $props.id();
	let pendingRemoval = $state<PlaylistItem | null>(null);
	let removalCancel = $state<HTMLButtonElement | null>(null);
	let addSlideButton = $state<HTMLButtonElement | null>(null);
	let removalReturnFocus: HTMLButtonElement | null = null;
	async function requestRemoval(item: PlaylistItem, button: HTMLButtonElement) {
		clearDrag();
		removalReturnFocus = button;
		pendingRemoval = item;
		await tick();
		removalCancel?.focus();
	}
	async function dismissRemoval() {
		pendingRemoval = null;
		await tick();
		if (removalReturnFocus?.isConnected) removalReturnFocus.focus();
		else addSlideButton?.focus();
	}
	function confirmRemoval() {
		const index = pendingRemoval ? draft.items.indexOf(pendingRemoval) : -1;
		if (index >= 0) {
			draft.items.splice(index, 1);
			announcement = 'Removed slide ' + (index + 1) + ' from the playlist.';
		}
		void dismissRemoval();
	}
</script>

<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>{data.playlist.id ? 'Edit playlist' : 'New playlist'}</H1><A
			class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
			href="/admin/monitors/playlists">All playlists</A
		></Div
	>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status" class="text-green-700 dark:text-green-400">{form.success}</P
		>{/if}
	<Card class="space-y-4"
		><P
			>Arrange slides in playback order. Leave a duration override empty to use the slide's display
			duration. Playlist crossfades overlap adjacent slides and add time around their fully visible
			display periods. A shorter override clips its element animations. Publish the playlist, then
			assign it in Monitor management.</P
		>
		<Form action="?/save" class="max-w-none" bind:isLoading={saving}>
			<Input type="hidden" name="id" value={data.playlist.id} /><Input
				type="hidden"
				name="version"
				value={String(data.playlist.version)}
			/><Input type="hidden" name="definition" value={JSON.stringify(draft)} />
			{#snippet inputs()}
				<Input label="Title" name="title" bind:value={title} required maxlength={160} /><Input
					label="Slug"
					name="slug"
					bind:value={slug}
					required
					maxlength={80}
					placeholder="break-room"
				/>
				<Checkbox label="Loop playlist" bind:checked={draft.loop} /><P class="text-sm"
					>With looping off, the last slide remains on screen. Published changes are still received.</P
				>
				<Checkbox
					label="Random starting slide"
					aria-label="Random starting slide"
					checked={draft.randomStart ?? false}
					onchange={(event) => (draft.randomStart = event.currentTarget.checked)}
				/>
				<P class="text-sm"
					>Choose a random starting point when the published playlist starts or changes, then follow
					the saved order. A non-looping playlist still plays every entry once.</P
				>
				<Input
					label="Upcoming slide previews"
					aria-label="Upcoming slide previews"
					type="number"
					min={1}
					max={5}
					step={1}
					value={String(draft.upcomingCount ?? 3)}
					oninput={(event) => (draft.upcomingCount = event.currentTarget.valueAsNumber)}
				/>
				<PlaylistTransitionFields bind:value={draft.transition} />
				<PlaylistTransitionPreview transition={draft.transition ?? defaultPlaylistTransition()} />
				<P class="text-sm"
					>A 10-second hold with 2-second crossfades is visible for 14 seconds; the next slide
					starts every 12 seconds. The countdown shows time until the next slide starts. Missing
					transition settings use a 2000ms crossfade. The final non-looping slide remains visible.</P
				>

				<P role="status" aria-live="polite" class="sr-only">{announcement}</P>
				<Div class="space-y-3 overflow-x-auto p-2" role="region" aria-label="Playlist slides">
					{#each draft.items as item, index (item)}
						<Card
							role="group"
							aria-label={`Playlist slide ${index + 1}`}
							draggable="true"
							class={`relative grid min-w-[52rem] grid-cols-[2.5rem_minmax(10rem,1fr)_8.5rem_12rem_10rem_2.5rem] items-end gap-3 p-4 ${draggedItem === item ? 'opacity-50' : ''}`}
							ondragstart={(event) => dragStart(event, item)}
							ondragover={(event) => dragOver(event, item)}
							ondragleave={(event) => {
								if (
									!event.currentTarget.contains(event.relatedTarget as Node | null) &&
									dropTarget?.item === item
								)
									dropTarget = null;
							}}
							ondrop={(event) => drop(event, item)}
							ondragend={clearDrag}
						>
							{#if dropTarget?.item === item}<Div
									aria-hidden="true"
									class={`bg-primary-500 pointer-events-none absolute inset-x-0 h-0.5 ${dropTarget.after ? 'bottom-0' : 'top-0'}`}
								></Div>{/if}
							<Button
								variants={['ghost', 'icon']}
								draggable="true"
								data-playlist-drag-handle
								class="cursor-grab active:cursor-grabbing"
								aria-label={`Reorder slide ${index + 1}`}
								title="Drag to reorder; Alt+Up/Down moves one position"
								onkeydown={(event) => {
									if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
										event.preventDefault();
										const offset = event.key === 'ArrowUp' ? -1 : 1;
										move(index, offset);
										announcement =
											'Slide moved to position ' + (draft.items.indexOf(item) + 1) + '.';
									}
								}}><GripVertical size={18} aria-hidden="true" /></Button
							>
							<Div class="min-w-0">
								<Select
									label={`Slide ${index + 1}`}
									class="w-full min-w-0"
									bind:value={item.slideId}
									options={[
										{ value: '', label: 'Choose a slide' },
										...data.slides.map((slide) => ({
											value: slide.id,
											label: slide.title + (slide.publishedAt ? '' : ' (unpublished)')
										}))
									]}
								/>
							</Div>
							<Div class="min-w-0">
								<Input
									label="Override (s)"
									aria-label={`Slide ${index + 1} override (seconds)`}
									class="w-full min-w-0"
									type="number"
									min={1}
									max={600}
									step={0.1}
									value={item.durationMs === null ? '' : String(item.durationMs / 1000)}
									oninput={(event) =>
										(item.durationMs =
											event.currentTarget.value === ''
												? null
												: Number(event.currentTarget.value) * 1000)}
								/>
							</Div>
							<PlaylistTransitionFields
								bind:value={item.transition}
								inherit
								compact
								label={`Transition into slide ${index + 1}`}
							/>
							<Button
								variants={['error', 'icon']}
								aria-label={`Remove slide ${index + 1}`}
								title="Remove slide"
								onclick={(event) => void requestRemoval(item, event.currentTarget)}
								><Trash2 size={18} aria-hidden="true" /></Button
							>
						</Card>
					{/each}
				</Div>

				<Div class="flex justify-end">
					<Button
						bind:element={addSlideButton}
						disabled={draft.items.length >= 100}
						onclick={() =>
							draft.items.push({ slideId: data.slides[0]?.id ?? '', durationMs: null })}
						>Add slide</Button
					>
				</Div>
			{/snippet}
			{#snippet buttons()}<Button type="submit" name="intent" value="draft" disabled={saving}
					>Save draft</Button
				><Button type="submit" name="intent" value="publish" disabled={saving}
					>Publish playlist</Button
				>{/snippet}
		</Form>
		<P class="text-sm"
			>{data.playlist.publishedAt
				? `Last published ${new Date(data.playlist.publishedAt).toLocaleString()}.`
				: 'This playlist has not been published.'}</P
		>
	</Card>
</Div>

{#if pendingRemoval}
	<Modal
		isOpen={true}
		onDismiss={dismissRemoval}
		role="alertdialog"
		title="Remove slide from playlist?"
		titleId={uid + '-remove-title'}
		aria-labelledby={uid + '-remove-title'}
		aria-describedby={uid + '-remove-description'}
		class="w-full max-w-lg space-y-4"
	>
		<P class="font-semibold break-words"
			>{data.slides.find((slide) => slide.id === pendingRemoval?.slideId)?.title ??
				'Selected slide'}</P
		>
		<P id={uid + '-remove-description'}
			>Remove this entry from the playlist? The slide itself will remain available in Slides. Save
			or publish the playlist to apply this change.</P
		>
		<DialogActions>
			<Button variants={['ghost']} bind:element={removalCancel} onclick={dismissRemoval}
				>Cancel</Button
			>
			<Button variants={['error']} onclick={confirmRemoval}>Remove slide</Button>
		</DialogActions>
	</Modal>
{/if}
