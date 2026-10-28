<script lang="ts">
	import { untrack } from 'svelte';
	import { A, Button, Card, Div, Form, H1, H2, Input, P, Select, Textarea } from '$lib/components';
	import SlideCanvas from './SlideCanvas.svelte';
	import {
		newElement,
		type AssetSummary,
		type ContentEditor,
		type ElementType,
		type SlideDefinition
	} from './types';
	import { parseJson, validateSlide } from './validation';
	let {
		data,
		form
	}: {
		data: { slide: ContentEditor<SlideDefinition>; assets: AssetSummary[] };
		form?: { error?: string; success?: string } | null;
	} = $props();
	let draft = $state(untrack(() => structuredClone($state.snapshot(data.slide.draft))));
	let title = $state(untrack(() => data.slide.title));
	let slug = $state(untrack(() => data.slide.slug));
	let selectedId = $state('');
	const selected = $derived(draft.elements.find((element) => element.id === selectedId));
	let elementType = $state<ElementType>('text');
	let timeMs = $state(0);
	let playing = $state(false);
	let saving = $state(false);
	let uploading = $state(false);
	let json = $state('');
	let localError = $state('');
	const elementTypes = ['text', 'image', 'svg', 'rectangle', 'ellipse', 'line'] as const;
	const geometry = ['x', 'y', 'width', 'height', 'rotation', 'scale', 'opacity'] as const;
	const poseFields = ['x', 'y', 'rotation', 'scale', 'opacity'] as const;
	function addElement() {
		const element = newElement(elementType, crypto.randomUUID());
		if (elementType === 'image' || elementType === 'svg')
			element.assetId =
				data.assets.find(
					(asset) => (asset.contentType === 'image/svg+xml') === (elementType === 'svg')
				)?.id ?? '';
		draft.elements.push(element);
		selectedId = element.id;
	}
	function preset(value: string) {
		if (!selected) return;
		selected.keyframes = [];
		if (value === 'none') return;
		const target = {
			x: selected.x,
			y: selected.y,
			opacity: 1,
			scale: 1,
			rotation: selected.rotation
		};
		const end = Math.min(800, draft.durationMs / 3);
		selected.keyframes = [
			{
				...target,
				atMs: 0,
				opacity: value === 'scale' ? 1 : 0,
				x: value === 'move' ? target.x - 160 : target.x,
				scale: value === 'scale' ? 0.5 : 1,
				easing: 'linear'
			},
			{ ...target, atMs: end, easing: 'ease-out' }
		];
		if (value === 'fade-out')
			selected.keyframes.push(
				{ ...target, atMs: draft.durationMs - end, easing: 'linear' },
				{ ...target, opacity: 0, atMs: draft.durationMs, easing: 'ease-in' }
			);
	}
	function addKeyframe() {
		if (!selected || selected.keyframes.some((frame) => frame.atMs === Math.round(timeMs))) return;
		selected.keyframes.push({
			x: selected.x,
			y: selected.y,
			opacity: selected.opacity,
			rotation: selected.rotation,
			scale: selected.scale,
			atMs: Math.round(timeMs),
			easing: 'linear'
		});
		selected.keyframes.sort((a, b) => a.atMs - b.atMs);
	}
	function importJson() {
		try {
			draft = validateSlide(parseJson(json));
			selectedId = '';
			playing = false;
			timeMs = 0;
			localError = '';
		} catch (cause) {
			localError = cause instanceof Error ? cause.message : 'Could not import this slide.';
		}
	}
	$effect(() => {
		if (!playing) return;
		const duration = draft.durationMs;
		if (!Number.isFinite(duration) || duration < 1000) return;
		const start = performance.now() - untrack(() => timeMs);
		let frame: number;
		const tick = (now: number) => {
			timeMs = (now - start) % duration;
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>{data.slide.id ? 'Edit slide' : 'New slide'}</H1><A href="/admin/monitors/slides"
			>All slides</A
		></Div
	>
	{#if form?.error || localError}<P role="alert" class="text-red-600 dark:text-red-400"
			>{localError || form?.error}</P
		>{/if}
	{#if form?.success}<P role="status" class="text-green-700 dark:text-green-400">{form.success}</P
		>{/if}
	<Div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
		<Div class="space-y-4">
			<div class="aspect-video overflow-hidden rounded-lg border border-gray-500">
				<SlideCanvas definition={draft} {timeMs} assetBase="/admin/monitors/slides/assets" />
			</div>
			<Card class="space-y-4">
				<Div class="flex items-center gap-4"
					><Button onclick={() => (playing = !playing)}>{playing ? 'Pause' : 'Play preview'}</Button
					><P>{(timeMs / 1000).toFixed(1)} / {(draft.durationMs / 1000).toFixed(1)} seconds</P></Div
				>
				<Input
					aria-label="Preview timeline"
					type="range"
					min={0}
					max={draft.durationMs}
					step={10}
					value={String(timeMs)}
					oninput={(event) => {
						playing = false;
						timeMs = Number(event.currentTarget.value);
					}}
				/>
			</Card>
			<Card class="space-y-4">
				<H2>Slide details</H2>
				<Form action="?/save" bind:isLoading={saving}>
					<Input type="hidden" name="id" value={data.slide.id} /><Input
						type="hidden"
						name="version"
						value={String(data.slide.version)}
					/><Input type="hidden" name="definition" value={JSON.stringify(draft)} />
					{#snippet inputs()}
						<Input label="Title" name="title" bind:value={title} required maxlength={160} />
						<Input
							label="Slug"
							name="slug"
							bind:value={slug}
							required
							maxlength={80}
							placeholder="safety-reminder"
						/>
						<Div class="grid grid-cols-2 gap-4">
							<Input
								label="Canvas width"
								type="number"
								min={320}
								max={4096}
								value={String(draft.width)}
								oninput={(e) => (draft.width = Number(e.currentTarget.value))}
							/>
							<Input
								label="Canvas height"
								type="number"
								min={240}
								max={4096}
								value={String(draft.height)}
								oninput={(e) => (draft.height = Number(e.currentTarget.value))}
							/>
							<Input label="Background" type="color" bind:value={draft.background} />
							<Input
								label="Duration (seconds)"
								type="number"
								min={1}
								max={600}
								step={0.1}
								value={String(draft.durationMs / 1000)}
								oninput={(e) => (draft.durationMs = Number(e.currentTarget.value) * 1000)}
							/>
						</Div>
					{/snippet}
					{#snippet buttons()}
						<Button type="submit" name="intent" value="draft" disabled={saving}>Save draft</Button>
						<Button type="submit" name="intent" value="publish" disabled={saving}
							>Publish slide</Button
						>
					{/snippet}
				</Form>
				<P class="text-sm"
					>{data.slide.publishedAt
						? `Last published ${new Date(data.slide.publishedAt).toLocaleString()}. Draft edits do not change playback.`
						: 'This slide has not been published.'}</P
				>
			</Card>
			<Card class="space-y-4"
				><H2>Upload an asset</H2>
				<Form action="?/upload" enctype="multipart/form-data" bind:isLoading={uploading}>
					{#snippet inputs()}<Input
							type="file"
							name="file"
							accept="image/png,image/jpeg,image/webp,image/svg+xml"
							required
						/>{/snippet}
					{#snippet buttons()}<Button type="submit" disabled={uploading}>Upload asset</Button
						>{/snippet}
				</Form><P class="text-sm"
					>PNG, JPEG, WebP under 3 MB; SVG under 300 KB. Uploads do not save slide edits.</P
				>
			</Card>
			<Card class="space-y-4"
				><H2>Import or export slide data</H2>
				<P
					>Generate a definition programmatically, import it here, then preview and save it. Export
					includes asset IDs, so keep referenced assets in this portal.</P
				>
				<Textarea label="Slide JSON" aria-label="Slide JSON" bind:value={json} rows={10} />
				<Div class="flex gap-4"
					><Button
						onclick={() => {
							json = JSON.stringify(draft, null, 2);
						}}>Export to JSON</Button
					><Button onclick={importJson}>Import from JSON</Button></Div
				>
			</Card>
		</Div>
		<Div class="space-y-4">
			<Card class="space-y-4"
				><H2>Elements</H2><P class="text-sm"
					>Later elements appear in front of earlier elements. Select one to edit its position and
					timeline.</P
				>
				<Select
					label="Element type"
					bind:value={elementType}
					options={elementTypes.map((value) => ({ value, label: value }))}
				/><Button onclick={addElement}>Add element</Button>
				{#each draft.elements as element, index (element.id)}
					<Div class="flex items-center gap-2"
						><Button
							class="min-w-0 flex-1 truncate"
							variants={selectedId === element.id ? [] : ['contrast']}
							onclick={() => (selectedId = element.id)}
							>{index + 1}. {element.type}: {element.text.slice(0, 24)}</Button
						><Button
							aria-label={`Remove element ${index + 1}`}
							variants={['error', 'small']}
							onclick={() => {
								draft.elements = draft.elements.filter((item) => item.id !== element.id);
							}}>Remove</Button
						></Div
					>
				{/each}
			</Card>
			{#if selected}
				<Card class="space-y-4"
					><H2>Element properties</H2>
					<Textarea
						label={selected.type === 'text' ? 'Text' : 'Description'}
						bind:value={selected.text}
						rows={3}
					/>
					<Div class="grid grid-cols-2 gap-3"
						>{#each geometry as field (field)}<Input
								label={field}
								type="number"
								step={0.1}
								value={String(selected[field])}
								oninput={(event) => {
									if (selected) selected[field] = Number(event.currentTarget.value);
								}}
							/>{/each}</Div
					>
					<Input label="Color" type="color" bind:value={selected.color} />
					{#if selected.type === 'text'}
						<Input
							label="Font size"
							type="number"
							min={8}
							max={500}
							value={String(selected.fontSize)}
							oninput={(e) => {
								if (selected) selected.fontSize = Number(e.currentTarget.value);
							}}
						/>
						<Select
							label="Font"
							bind:value={selected.fontFamily}
							options={['sans-serif', 'serif', 'monospace'].map((value) => ({
								value,
								label: value
							}))}
						/>
						<Select
							label="Alignment"
							bind:value={selected.align}
							options={['left', 'center', 'right'].map((value) => ({ value, label: value }))}
						/>
					{:else if selected.type === 'image' || selected.type === 'svg'}
						<Select
							label="Asset"
							bind:value={selected.assetId}
							options={[
								{ value: '', label: 'Choose an asset' },
								...data.assets
									.filter(
										(asset) =>
											(asset.contentType === 'image/svg+xml') === (selected?.type === 'svg')
									)
									.map((asset) => ({ value: asset.id, label: asset.name }))
							]}
						/>
						<Select
							label="Image fit"
							bind:value={selected.fit}
							options={['contain', 'cover'].map((value) => ({ value, label: value }))}
						/>
					{/if}
					<Button
						onclick={() => {
							if (!selected) return;
							const element = selected;
							draft.elements = [
								...draft.elements.filter((item) => item.id !== element.id),
								element
							];
						}}>Bring to front</Button
					>
				</Card>
				<Card class="space-y-4"
					><H2>Animation timeline</H2><P class="text-sm"
						>Keyframes specify complete poses at times in milliseconds. Values interpolate between
						them; the final pose stays on screen. Keyframe times must be increasing.</P
					>
					<Div class="flex flex-wrap gap-2"
						>{#each [['none', 'None'], ['fade', 'Fade in'], ['move', 'Move in'], ['scale', 'Scale in'], ['fade-out', 'Fade in and out']] as [value, label] (value)}<Button
								variants={['small', 'contrast']}
								onclick={() => preset(value)}>{label}</Button
							>{/each}</Div
					>
					<Button onclick={addKeyframe}>Add keyframe at preview time</Button>
					{#each selected.keyframes as frame, index (frame)}
						<Div class="space-y-3 rounded border border-gray-500 p-3">
							<Input
								label="Time (ms)"
								type="number"
								min={0}
								max={draft.durationMs}
								value={String(frame.atMs)}
								oninput={(e) => (frame.atMs = Number(e.currentTarget.value))}
							/>
							<Div class="grid grid-cols-2 gap-2"
								>{#each poseFields as field (field)}<Input
										label={field}
										type="number"
										step={0.1}
										value={String(frame[field])}
										oninput={(e) => (frame[field] = Number(e.currentTarget.value))}
									/>{/each}</Div
							>
							<Select
								label="Easing into this frame"
								bind:value={frame.easing}
								options={['linear', 'ease-in', 'ease-out', 'ease-in-out'].map((value) => ({
									value,
									label: value
								}))}
							/>
							<Button
								variants={['small', 'error']}
								onclick={() => {
									selected?.keyframes.splice(index, 1);
								}}>Remove keyframe</Button
							>
						</Div>
					{/each}
				</Card>
			{/if}
		</Div>
	</Div>
</Div>
