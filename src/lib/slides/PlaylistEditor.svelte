<script lang="ts">
	import { untrack } from 'svelte';
	import { A, Button, Card, Checkbox, Div, Form, H1, Input, P, Select } from '$lib/components';
	import type { ContentEditor, PlaylistDefinition } from './types';
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
	let draft = $state(untrack(() => structuredClone($state.snapshot(data.playlist.draft))));
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
			href="/admin/monitors/playlists">All playlists</A
		></Div
	>
	{#if form?.error}<P role="alert" class="text-red-600 dark:text-red-400">{form.error}</P>{/if}
	{#if form?.success}<P role="status" class="text-green-700 dark:text-green-400">{form.success}</P
		>{/if}
	<Card class="space-y-4"
		><P
			>Arrange slides in playback order. Leave a duration override empty to use the slide's
			duration. A shorter override clips its animation. Publish the playlist, then assign it in
			Monitor management.</P
		>
		<Form action="?/save" bind:isLoading={saving}>
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
				{#each draft.items as item, index (item)}
					<Div
						class="grid items-end gap-4 rounded border border-gray-500 p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]"
					>
						<Select
							label={`Slide ${index + 1}`}
							bind:value={item.slideId}
							options={[
								{ value: '', label: 'Choose a slide' },
								...data.slides.map((slide) => ({
									value: slide.id,
									label: `${slide.title}${slide.publishedAt ? '' : ' (unpublished)'}`
								}))
							]}
						/>
						<Input
							label="Override (seconds)"
							type="number"
							min={1}
							max={600}
							step={0.1}
							value={item.durationMs === null ? '' : String(item.durationMs / 1000)}
							oninput={(e) =>
								(item.durationMs =
									e.currentTarget.value === '' ? null : Number(e.currentTarget.value) * 1000)}
						/>
						<Div class="flex gap-2"
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
