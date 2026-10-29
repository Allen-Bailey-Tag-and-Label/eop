<script lang="ts">
	import { untrack } from 'svelte';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import { A, Button, Card, Checkbox, Div, Form, H1, Input, P, Select } from '$lib/components';
	import type { ContentEditor, PlaylistDefinition } from './types';
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
				{#each draft.items as item, index (item)}
					<Div class="flex flex-wrap items-end gap-4 rounded border border-gray-500 p-4">
						<Div class="min-w-0 grow basis-64">
							<Select
								label={`Slide ${index + 1}`}
								class="w-full min-w-0"
								bind:value={item.slideId}
								options={[
									{ value: '', label: 'Choose a slide' },
									...data.slides.map((slide) => ({
										value: slide.id,
										label: `${slide.title}${slide.publishedAt ? '' : ' (unpublished)'}`
									}))
								]}
							/>
						</Div>
						<Div class="min-w-0 grow basis-48">
							<Input
								label="Override (seconds)"
								class="w-full min-w-0"
								type="number"
								min={1}
								max={600}
								step={0.1}
								value={item.durationMs === null ? '' : String(item.durationMs / 1000)}
								oninput={(e) =>
									(item.durationMs =
										e.currentTarget.value === '' ? null : Number(e.currentTarget.value) * 1000)}
							/>
						</Div>
						<Div class="flex flex-wrap gap-2"
							><Button
								aria-label={`Move slide ${index + 1} up`}
								disabled={index === 0}
								onclick={() => move(index, -1)}>Up</Button
							><Button
								aria-label={`Move slide ${index + 1} down`}
								disabled={index === draft.items.length - 1}
								onclick={() => move(index, 1)}>Down</Button
							><Button variants={['error']} onclick={() => draft.items.splice(index, 1)}
								>Remove</Button
							></Div
						>
						<Div class="w-full min-w-0">
							<PlaylistTransitionFields
								bind:value={item.transition}
								inherit
								label={`Transition into slide ${index + 1}`}
							/>
						</Div>
					</Div>
				{/each}
				<Button
					disabled={draft.items.length >= 100}
					onclick={() => draft.items.push({ slideId: data.slides[0]?.id ?? '', durationMs: null })}
					>Add slide</Button
				>
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
