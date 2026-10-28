<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import {
		ArrowLeft,
		Plus,
		Settings,
		Upload,
		Import as ImportIcon,
		FileOutput,
		Save,
		Send,
		MousePointer2,
		Hand,
		Maximize2,
		Palette,
		Type,
		Image,
		Shapes,
		Square,
		Circle,
		Minus,
		Layers,
		SlidersHorizontal,
		X,
		Play,
		Pause,
		SkipBack,
		ZoomIn,
		ZoomOut,
		Scan,
		Diamond,
		Trash2,
		Download,
		ChevronDown
	} from '@lucide/svelte';
	import {
		A,
		Button,
		Div,
		DropdownMenu,
		Form,
		H1,
		H2,
		Input,
		Modal,
		P,
		Select,
		Textarea
	} from '$lib/components';
	import SlideWorkspace from './SlideWorkspace.svelte';
	import {
		newElement,
		type AssetSummary,
		type ContentEditor,
		type ElementType,
		type SlideReference,
		type SlideDefinition
	} from './types';
	import { parseJson, validateSlide } from './validation';
	import { withResponsiveDefaults } from './layout';
	let {
		data,
		form
	}: {
		data: {
			slide: ContentEditor<SlideDefinition>;
			assets: AssetSummary[];
			references?: SlideReference[];
		};
		form?: { error?: string; success?: string; references?: SlideReference[] } | null;
	} = $props();
	let draft = $state(
		untrack(() => withResponsiveDefaults(structuredClone($state.snapshot(data.slide.draft))))
	);
	let title = $state(untrack(() => data.slide.title));
	let slug = $state(untrack(() => data.slide.slug));
	let backgroundColor = $state(
		untrack(() =>
			data.slide.draft.background === 'transparent' ? '#09090c' : data.slide.draft.background
		)
	);
	let selectedId = $state('');
	const selected = $derived(draft.elements.find((element) => element.id === selectedId));
	let timeMs = $state(0);
	let playing = $state(false);
	let saving = $state(false);
	let uploading = $state(false);
	let managing = $state(false);
	const references = $derived(form?.references ?? data.references ?? []);
	let json = $state('');
	let localError = $state('');
	let tool = $state<'select' | 'pan' | 'resize'>('select');
	let zoom = $state(1);
	let resetView = $state(0);
	let previewPreset = $state('reference');
	const previewSizes: Record<string, { width: number; height: number }> = {
		wide: { width: 1920, height: 1080 },
		taller: { width: 1920, height: 1200 },
		ultrawide: { width: 2520, height: 1080 },
		portrait: { width: 1080, height: 1920 }
	};
	const viewport = $derived(
		previewSizes[previewPreset] ?? { width: draft.width, height: draft.height }
	);
	let inspectorOpen = $state(false);
	let inspectorTab = $state<'properties' | 'layers' | 'animation'>('properties');
	let dialog = $state<'settings' | 'upload' | 'import' | 'export' | 'unpublish' | 'delete'>(
		'settings'
	);
	const dialogTitles = {
		settings: 'Slide settings',
		upload: 'Upload an asset',
		import: 'Import slide JSON',
		export: 'Export slide JSON',
		unpublish: 'Unpublish slide?',
		delete: 'Delete slide?'
	};
	let isDialogOpen = $state(false);
	let returnFocus: HTMLElement | null = null;
	let colorInput = $state<HTMLInputElement | null>(null);
	const uid = $props.id();
	const transitionDirections = ['transitionIn', 'transitionOut'] as const;
	const geometry = ['x', 'y', 'width', 'height', 'rotation', 'scale', 'opacity'] as const;
	const poseFields = ['x', 'y', 'rotation', 'scale', 'opacity'] as const;
	const elementTools = [
		{ type: 'text', label: 'Text', icon: Type },
		{ type: 'image', label: 'Image', icon: Image },
		{ type: 'svg', label: 'SVG', icon: Shapes },
		{ type: 'rectangle', label: 'Rectangle', icon: Square },
		{ type: 'ellipse', label: 'Ellipse', icon: Circle },
		{ type: 'line', label: 'Line', icon: Minus }
	] as const;
	const dirty = $derived(
		JSON.stringify({ title, slug, draft }) !==
			JSON.stringify({ title: data.slide.title, slug: data.slide.slug, draft: data.slide.draft })
	);
	onMount(() => {
		inspectorOpen = window.matchMedia('(min-width: 1024px)').matches;
	});
	function showPanel(tab: typeof inspectorTab) {
		inspectorTab = tab;
		inspectorOpen = true;
	}
	function addElement(type: ElementType) {
		const element = newElement(type, crypto.randomUUID());
		if (type === 'image' || type === 'svg')
			element.assetId =
				data.assets.find((asset) => (asset.contentType === 'image/svg+xml') === (type === 'svg'))
					?.id ?? '';
		draft.elements.push(element);
		selectedId = element.id;
		tool = 'select';
		playing = false;
		showPanel('properties');
	}
	function openDialog(value: typeof dialog) {
		if (!isDialogOpen) returnFocus = document.activeElement as HTMLElement;
		dialog = value;
		if (value === 'export') json = JSON.stringify(draft, null, 2);
		if (value === 'import') json = '';
		localError = '';
		isDialogOpen = true;
		if (value === 'unpublish' || value === 'delete')
			void tick().then(() => document.getElementById(`${uid}-dialog-cancel`)?.focus());
	}
	function closeDialog() {
		if (!uploading && !managing) isDialogOpen = false;
	}
	$effect(() => {
		if (!isDialogOpen)
			untrack(() => {
				void tick().then(() => returnFocus?.focus());
			});
	});
	function escape(event: KeyboardEvent) {
		if (event.key === 'Escape' && !event.defaultPrevented && isDialogOpen) {
			event.preventDefault();
			closeDialog();
		}
	}
	function importJson() {
		try {
			draft = validateSlide(parseJson(json));
			selectedId = '';
			playing = false;
			timeMs = 0;
			localError = '';
			closeDialog();
		} catch (cause) {
			localError = cause instanceof Error ? cause.message : 'Could not import this slide.';
		}
	}
	async function readJson(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		if (file.size > 250000) {
			localError = 'Slide JSON must be under 250 KB.';
			return;
		}
		try {
			json = await file.text();
			localError = '';
		} catch {
			localError = 'Could not read the JSON file.';
		}
	}
	function downloadJson() {
		const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `${slug || 'slide'}.json`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}
	function fitView() {
		zoom = 1;
		resetView++;
	}
	async function editColor() {
		showPanel('properties');
		await tick();
		colorInput?.click();
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
	$effect(() => {
		if (!playing) return;
		const duration = draft.durationMs;
		if (!Number.isFinite(duration) || duration < 1000) return;
		const start = performance.now() - untrack(() => timeMs);
		let frame: number;
		const animate = (now: number) => {
			timeMs = (now - start) % duration;
			frame = requestAnimationFrame(animate);
		};
		frame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frame);
	});
</script>

<svelte:window onkeydown={escape} />
<Div
	class="absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden bg-white text-slate-900 dark:bg-gray-900 dark:text-gray-100"
	role="region"
	aria-label="Slide editor"
>
	<Div
		class="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-300 px-2 py-2 dark:border-gray-700"
		aria-label="Document actions"
		role="toolbar"
	>
		<A href="/admin/monitors/slides" aria-label="All slides" title="All slides" class="shrink-0 p-2"
			><ArrowLeft size={18} /></A
		>
		<Div class="hidden min-w-0 shrink-0 space-y-0.5 pr-3 xl:block"
			><H1 class="max-w-48 truncate text-sm">{title || 'Untitled slide'}</H1><P
				class="text-xs opacity-60"
				>{dirty ? 'Unsaved changes' : data.slide.id ? 'Draft saved' : 'New slide'}</P
			></Div
		>
		<DropdownMenu
			class="shrink-0 [&>button]:inline-flex [&>button]:h-9 [&>button]:items-center [&>button]:px-2 [&>button]:py-1 [&>button]:text-sm [&>button]:text-white [&>button]:hover:text-white [&>button]:focus:text-white"
			label="Add element"
			items={elementTools.map((item) => ({ value: item.type, label: item.label }))}
			onSelect={(item) => addElement(item.value as ElementType)}
		>
			<span class="inline-flex flex-nowrap items-center gap-1 whitespace-nowrap">
				<Plus size={18} class="shrink-0" /><span class="hidden md:inline">Add</span><ChevronDown
					size={14}
					class="shrink-0"
				/>
			</span>
		</DropdownMenu>
		<Button
			aria-label="Settings"
			title="Slide settings"
			variants={['ghost']}
			class="h-9 shrink-0 items-center gap-2 px-2 py-1 text-sm"
			onclick={() => openDialog('settings')}
			><Settings size={18} /><span class="hidden md:inline">Settings</span></Button
		>
		<Button
			aria-label="Upload asset"
			title="Upload asset"
			variants={['ghost']}
			class="h-9 shrink-0 items-center gap-2 px-2 py-1 text-sm"
			onclick={() => openDialog('upload')}
			><Upload size={18} /><span class="hidden lg:inline">Upload asset</span></Button
		>
		<Button
			aria-label="Import"
			title="Import slide JSON"
			variants={['ghost']}
			class="h-9 shrink-0 items-center gap-2 px-2 py-1 text-sm"
			onclick={() => openDialog('import')}
			><ImportIcon size={18} /><span class="hidden lg:inline">Import</span></Button
		>
		<Button
			aria-label="Export"
			title="Export slide JSON"
			variants={['ghost']}
			class="h-9 shrink-0 items-center gap-2 px-2 py-1 text-sm"
			onclick={() => openDialog('export')}
			><FileOutput size={18} /><span class="hidden lg:inline">Export</span></Button
		>
		<Form
			action="?/save"
			class="ml-auto flex w-auto max-w-none shrink-0 items-center gap-2 space-y-0"
			submitFunction={({ cancel }) => {
				if (!title.trim() || !slug.trim()) {
					cancel();
					openDialog('settings');
					localError = 'Enter a title and slug before saving.';
					return;
				}
				saving = true;
				return async ({ update }) => {
					try {
						await update();
					} finally {
						saving = false;
					}
				};
			}}
		>
			<Input type="hidden" name="id" value={data.slide.id} /><Input
				type="hidden"
				name="version"
				value={String(data.slide.version)}
			/><Input type="hidden" name="definition" value={JSON.stringify(draft)} /><Input
				type="hidden"
				name="title"
				value={title}
			/><Input type="hidden" name="slug" value={slug} />
			<Button
				aria-label="Save draft"
				title="Save draft"
				type="submit"
				name="intent"
				value="draft"
				class="h-9 items-center gap-2 px-3 py-1 text-sm"
				disabled={saving}
				><Save size={18} /><span class="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span
				></Button
			>
			<Button
				aria-label="Publish slide"
				title="Publish slide"
				type="submit"
				name="intent"
				value="publish"
				variants={['ghost']}
				class="h-9 items-center gap-2 px-2 py-1 text-sm"
				disabled={saving}><Send size={18} /><span class="hidden md:inline">Publish</span></Button
			>
		</Form>
		<Button
			aria-label="Toggle properties panel"
			title="Properties and layers"
			aria-pressed={inspectorOpen}
			variants={['ghost']}
			class="h-9 w-9 shrink-0 items-center p-0"
			onclick={() => (inspectorOpen = !inspectorOpen)}><SlidersHorizontal size={18} /></Button
		>
	</Div>
	{#if !isDialogOpen}
		{#if form?.error || localError}<P
				role="alert"
				class="shrink-0 truncate border-b px-3 py-1 text-xs text-red-600 dark:text-red-400"
				title={localError || form?.error}>{localError || form?.error}</P
			>
		{:else if form?.success}<P
				role="status"
				class="shrink-0 truncate border-b px-3 py-1 text-xs text-green-700 dark:text-green-400"
				title={form.success}>{form.success}</P
			>{/if}
	{/if}
	<Div class="relative flex min-h-0 flex-1 overflow-hidden">
		<Div
			class="z-1 flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-slate-300 py-2 dark:border-gray-700"
			role="toolbar"
			aria-label="Canvas tools"
		>
			{#each [{ value: 'select', label: 'Select and move', icon: MousePointer2 }, { value: 'pan', label: 'Hand tool', icon: Hand }, { value: 'resize', label: 'Resize tool', icon: Maximize2 }] as item (item.value)}
				<Button
					aria-label={item.label}
					title={item.label}
					aria-pressed={tool === item.value}
					variants={tool === item.value ? [] : ['ghost']}
					class="h-9 w-9 shrink-0 items-center p-0"
					onclick={() => {
						tool = item.value as typeof tool;
					}}><item.icon size={18} /></Button
				>
			{/each}
			<Button
				aria-label="Edit element color"
				title="Element color"
				disabled={!selected}
				variants={['ghost']}
				class="h-9 w-9 shrink-0 items-center p-0"
				onclick={editColor}><Palette size={18} /></Button
			>
			<Div class="my-1 w-7 border-t border-slate-300 dark:border-gray-700"></Div>
			{#each elementTools as item (item.type)}<Button
					aria-label={`Add ${item.label.toLowerCase()}`}
					title={`Add ${item.label.toLowerCase()}`}
					variants={['ghost']}
					class="h-9 w-9 shrink-0 items-center p-0"
					onclick={() => addElement(item.type)}><item.icon size={18} /></Button
				>{/each}
			<Div class="my-1 w-7 border-t border-slate-300 dark:border-gray-700"></Div>
			<Button
				aria-label="Show layers"
				title="Layers"
				variants={['ghost']}
				class="h-9 w-9 shrink-0 items-center p-0"
				onclick={() => showPanel('layers')}><Layers size={18} /></Button
			>
			<Button
				aria-label="Remove selected element"
				title="Remove selected element"
				disabled={!selected}
				variants={['ghost']}
				class="h-9 w-9 shrink-0 items-center p-0"
				onclick={() => {
					draft.elements = draft.elements.filter((element) => element.id !== selectedId);
					selectedId = '';
				}}><Trash2 size={18} /></Button
			>
		</Div>
		<Div class="relative min-h-0 min-w-0 flex-1">
			<SlideWorkspace
				bind:definition={draft}
				bind:selectedId
				{timeMs}
				{tool}
				animateTransitions={playing || timeMs > 0}
				{zoom}
				{resetView}
				viewportWidth={viewport.width}
				viewportHeight={viewport.height}
				onEdit={() => {
					playing = false;
				}}
			/>
			<Div
				class="pointer-events-none absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2 text-xs"
				><span
					class="rounded bg-white/85 px-2 py-1 text-slate-700 dark:bg-gray-900/85 dark:text-gray-300"
					>{viewport.width} × {viewport.height} · {draft.elements.length} elements</span
				><span
					class="hidden rounded bg-white/85 px-2 py-1 text-slate-700 lg:block dark:bg-gray-900/85 dark:text-gray-300"
					>{tool === 'pan'
						? 'Drag to pan the canvas'
						: tool === 'resize'
							? 'Select an element, then drag its corner handle'
							: 'Drag elements to move · Arrow keys to nudge'}</span
				></Div
			>
		</Div>
		{#if inspectorOpen}
			<Div
				class="absolute top-0 right-0 bottom-0 z-2 flex w-72 max-w-[calc(100%_-_3rem)] shrink-0 flex-col border-l border-slate-300 bg-white shadow-lg lg:static lg:shadow-none dark:border-gray-700 dark:bg-gray-900"
				aria-label="Inspector"
			>
				<Div
					class="flex shrink-0 items-center gap-1 border-b border-slate-300 p-2 dark:border-gray-700"
				>
					{#each ['properties', 'layers', 'animation'] as tab (tab)}<Button
							aria-pressed={inspectorTab === tab}
							variants={inspectorTab === tab ? [] : ['ghost']}
							class="min-w-0 flex-1 px-2 py-1 text-xs capitalize"
							onclick={() => (inspectorTab = tab as typeof inspectorTab)}>{tab}</Button
						>{/each}
					<Button
						aria-label="Close properties panel"
						variants={['ghost']}
						class="h-7 w-7 shrink-0 items-center p-0"
						onclick={() => (inspectorOpen = false)}><X size={15} /></Button
					>
				</Div>
				<Div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
					{#if inspectorTab === 'layers'}
						<H2 class="text-sm">Layers</H2><P class="text-xs opacity-60"
							>Later elements appear in front.</P
						>
						{#each draft.elements as element, index (element.id)}<Button
								class="w-full min-w-0 justify-start truncate px-3 py-2 text-left text-xs"
								aria-pressed={selectedId === element.id}
								variants={selectedId === element.id ? [] : ['ghost']}
								onclick={() => (selectedId = element.id)}
								>{index + 1}. {element.type}: {element.text.slice(0, 32)}</Button
							>{/each}
						{#if !draft.elements.length}<P class="text-sm opacity-60"
								>Use Add or the left rail to create your first element.</P
							>{/if}
					{:else if !selected}<P class="text-sm opacity-60"
							>Select an element on the canvas or in Layers to edit its properties and animation.</P
						>
					{:else if inspectorTab === 'properties'}<H2 class="text-sm">Element properties</H2>
						<Select
							label="Horizontal anchoring"
							aria-label="Horizontal anchoring"
							bind:value={selected.horizontalAnchor}
							options={[
								{ value: 'scale', label: 'Scale' },
								{ value: 'left', label: 'Left' },
								{ value: 'right', label: 'Right' },
								{ value: 'center', label: 'Center' },
								{ value: 'stretch', label: 'Left & right' }
							]}
						/>
						<Select
							label="Vertical anchoring"
							aria-label="Vertical anchoring"
							bind:value={selected.verticalAnchor}
							options={[
								{ value: 'scale', label: 'Scale' },
								{ value: 'top', label: 'Top' },
								{ value: 'bottom', label: 'Bottom' },
								{ value: 'center', label: 'Center' },
								{ value: 'stretch', label: 'Top & bottom' }
							]}
						/>
						<P class="text-xs opacity-60"
							>Anchors preserve the reference design and control other screen shapes. Scale follows
							screen proportions; edge and center anchors keep spacing and size proportional.
							Opposite edges stretch the box. X/Y are reference coordinates.</P
						>
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
						<Input
							bind:element={colorInput}
							aria-label="Element color"
							label="Color"
							type="color"
							bind:value={selected.color}
						/>
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
					{:else}
						<H2>Animation timeline</H2><P class="text-sm"
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
					{/if}
				</Div>
			</Div>
		{/if}
	</Div>
	<Div
		class="shrink-0 space-y-2 border-t border-slate-300 px-3 py-2 dark:border-gray-700"
		role="region"
		aria-label="Animation timeline controls"
	>
		<Div class="flex flex-wrap items-center gap-2">
			<Button
				aria-label="Restart preview"
				title="Restart preview"
				variants={['ghost']}
				class="h-8 w-8 shrink-0 items-center p-0"
				onclick={() => {
					playing = false;
					timeMs = 0;
				}}><SkipBack size={17} /></Button
			>
			<Button
				aria-label={playing ? 'Pause preview' : 'Play preview'}
				title={playing ? 'Pause preview' : 'Play preview'}
				class="h-8 w-8 shrink-0 items-center p-0"
				onclick={() => (playing = !playing)}
				>{#if playing}<Pause size={17} />{:else}<Play size={17} />{/if}</Button
			>
			<P class="shrink-0 font-mono text-xs tabular-nums"
				>{(timeMs / 1000).toFixed(1)} / {(draft.durationMs / 1000).toFixed(1)}s</P
			>
			<Button
				aria-label="Add keyframe at preview time"
				title="Add keyframe at preview time"
				disabled={!selected}
				variants={['ghost']}
				class="h-8 items-center gap-1 px-2 py-1 text-xs"
				onclick={() => {
					addKeyframe();
					showPanel('animation');
				}}><Diamond size={15} /><span class="hidden sm:inline">Keyframe</span></Button
			>
			<Select
				aria-label="Preview aspect ratio"
				title="Preview aspect ratio"
				class="h-8 w-40 px-2 py-1 text-xs"
				bind:value={previewPreset}
				onchange={fitView}
				options={[
					{ value: 'reference', label: 'Reference size' },
					{ value: 'wide', label: '16:9 landscape' },
					{ value: 'taller', label: '16:10 landscape' },
					{ value: 'ultrawide', label: '21:9 ultrawide' },
					{ value: 'portrait', label: '9:16 portrait' }
				]}
			/>
			<Div class="ml-auto flex shrink-0 items-center gap-1"
				><Button
					aria-label="Zoom out"
					title="Zoom out"
					disabled={zoom <= 0.25}
					variants={['ghost']}
					class="h-8 w-8 items-center p-0"
					onclick={() => (zoom = Math.max(0.25, zoom - 0.25))}><ZoomOut size={16} /></Button
				><span class="min-w-10 text-center text-xs">{Math.round(zoom * 100)}%</span><Button
					aria-label="Zoom in"
					title="Zoom in"
					disabled={zoom >= 4}
					variants={['ghost']}
					class="h-8 w-8 items-center p-0"
					onclick={() => (zoom = Math.min(4, zoom + 0.25))}><ZoomIn size={16} /></Button
				><Button
					aria-label="Fit canvas"
					title="Fit canvas"
					variants={['ghost']}
					class="h-8 w-8 items-center p-0"
					onclick={fitView}><Scan size={16} /></Button
				></Div
			>
		</Div>
		<Div class="relative px-2">
			<Input
				aria-label="Preview timeline"
				type="range"
				class="w-full px-0 py-1"
				min={0}
				max={draft.durationMs}
				step={10}
				value={String(timeMs)}
				oninput={(event) => {
					playing = false;
					timeMs = Number(event.currentTarget.value);
				}}
			/>
			<Div class="relative h-5 border-t border-slate-300 dark:border-gray-700">
				{#each [0, 0.25, 0.5, 0.75, 1] as fraction (fraction)}<span
						class="absolute top-1 -translate-x-1/2 text-[10px] opacity-60"
						style={`left:${fraction * 100}%;`}
						>{((draft.durationMs * fraction) / 1000).toFixed(1)}s</span
					>{/each}
				{#if selected}{#each selected.keyframes as frame, index (frame)}<Button
							aria-label={`Keyframe ${index + 1} at ${frame.atMs} milliseconds`}
							title={`Keyframe ${index + 1} · ${(frame.atMs / 1000).toFixed(2)}s`}
							variants={['ghost']}
							class="absolute -top-2 h-4 w-4 -translate-x-1/2 items-center p-0 text-sky-600"
							style={`left:${Math.max(0, Math.min(100, (frame.atMs / draft.durationMs) * 100))}%;`}
							onclick={() => {
								playing = false;
								timeMs = frame.atMs;
								showPanel('animation');
							}}><Diamond size={13} fill="currentColor" /></Button
						>{/each}{/if}
			</Div>
		</Div>
	</Div>
</Div>

{#if isDialogOpen}
	<Modal
		bind:isOpen={isDialogOpen}
		isCloseable={!uploading && !managing}
		role="dialog"
		aria-modal="true"
		aria-labelledby={`${uid}-dialog-title`}
		class="flex max-h-[85svh] w-full max-w-2xl flex-col gap-4 overflow-hidden p-5"
	>
		<Div class="flex shrink-0 items-center justify-between gap-4"
			><H2 id={`${uid}-dialog-title`} class="text-lg">{dialogTitles[dialog]}</H2><Button
				aria-label="Close dialog"
				variants={['ghost']}
				class="h-8 w-8 items-center p-0"
				disabled={uploading || managing}
				onclick={closeDialog}><X size={18} /></Button
			></Div
		>
		<Div class="-m-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-1">
			{#if localError}<P role="alert" class="text-sm text-red-600 dark:text-red-400">{localError}</P
				>{/if}
			{#if dialog === 'settings'}
				<P class="text-sm opacity-60"
					>Reference dimensions set the coordinate units for your design. The slide fills the
					monitor; use element anchoring and the aspect-ratio previews to control different screen
					shapes.</P
				>
				<Input
					label="Title"
					aria-label="Slide title"
					bind:value={title}
					required
					maxlength={160}
				/><Input
					label="Slug"
					aria-label="Slide slug"
					bind:value={slug}
					required
					maxlength={80}
					placeholder="safety-reminder"
				/>
				<Div class="grid grid-cols-2 gap-4"
					><Input
						label="Reference width"
						aria-label="Reference width"
						type="number"
						min={320}
						max={4096}
						value={String(draft.width)}
						oninput={(e) => (draft.width = Number(e.currentTarget.value))}
					/><Input
						label="Reference height"
						aria-label="Reference height"
						type="number"
						min={240}
						max={4096}
						value={String(draft.height)}
						oninput={(e) => (draft.height = Number(e.currentTarget.value))}
					/><Input
						label="Background"
						aria-label="Slide background"
						type="color"
						value={draft.background === 'transparent' ? backgroundColor : draft.background}
						disabled={draft.background === 'transparent'}
						oninput={(event) => {
							backgroundColor = event.currentTarget.value;
							draft.background = backgroundColor;
						}}
					/><Input
						label="Duration (seconds)"
						aria-label="Slide duration in seconds"
						type="number"
						min={1}
						max={600}
						step={0.1}
						value={String(draft.durationMs / 1000)}
						oninput={(e) => (draft.durationMs = Number(e.currentTarget.value) * 1000)}
					/></Div
				>
				<Select
					label="Background type"
					aria-label="Slide background type"
					value={draft.background === 'transparent' ? 'transparent' : 'solid'}
					options={[
						{ label: 'Solid color', value: 'solid' },
						{ label: 'Transparent', value: 'transparent' }
					]}
					onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
						if (event.currentTarget.value === 'transparent') {
							if (draft.background !== 'transparent') backgroundColor = draft.background;
							draft.background = 'transparent';
						} else draft.background = backgroundColor;
					}}
				/>
				<P class="font-semibold">Whole-slide transitions</P>
				{#each transitionDirections as direction (direction)}
					<Div class="grid grid-cols-2 gap-4">
						<Select
							label={direction === 'transitionIn' ? 'Transition in' : 'Transition out'}
							aria-label={direction === 'transitionIn'
								? 'Slide transition in'
								: 'Slide transition out'}
							bind:value={draft[direction].type}
							options={[
								{ label: 'Fade', value: 'fade' },
								{ label: 'None', value: 'none' }
							]}
						/>
						<Input
							label="Duration (ms)"
							aria-label={direction === 'transitionIn'
								? 'Slide transition in duration in milliseconds'
								: 'Slide transition out duration in milliseconds'}
							type="number"
							min={0}
							max={600000}
							step={100}
							disabled={draft[direction].type === 'none'}
							value={String(draft[direction].durationMs)}
							oninput={(event) => (draft[direction].durationMs = Number(event.currentTarget.value))}
						/>
					</Div>
				{/each}
				<P class="text-xs opacity-60"
					>Fades include the background and all elements, within the slide duration. Short slides
					shorten the fades proportionally. Play or scrub the timeline to preview them. A
					non-looping playlist keeps its final slide visible.</P
				>
				<P class="text-xs opacity-60"
					>{data.slide.publishedAt
						? `Last published ${new Date(data.slide.publishedAt).toLocaleString()}.`
						: 'This slide has not been published.'} Use Save for a draft or Publish to update monitors.</P
				>
				<Button onclick={closeDialog}>Done</Button>
				{#if data.slide.id}
					<Div class="flex flex-wrap gap-3 border-t pt-4">
						{#if data.slide.publishedAt}
							<Button
								variants={['contrast']}
								disabled={saving}
								onclick={() => openDialog('unpublish')}
							>
								Unpublish slide
							</Button>
						{/if}
						<Button variants={['error']} disabled={saving} onclick={() => openDialog('delete')}>
							<Trash2 size={18} /> Delete slide
						</Button>
					</Div>
				{/if}
			{:else if dialog === 'unpublish' || dialog === 'delete'}
				<P>
					{#if dialog === 'unpublish'}
						Unpublish “{data.slide.title}”? Its saved draft and playlist entries will remain.
						Monitors skip this slide after their next refresh, switching between slides. Playlists
						with no published slides show the no-playlist screen. Disconnected monitors continue
						loaded content until they reconnect. Publishing the slide again restores playback.
					{:else}
						Permanently delete “{data.slide.title}”? Its draft, published content, and any unsaved
						edits will be lost. Uploaded assets will remain available to other slides.
					{/if}
				</P>
				{#if references.length}
					<P class="font-semibold">Playlists using this slide</P>
					{#each references as reference (reference.slug)}
						<P>
							<A href={`/admin/monitors/playlists/${reference.slug}`}>{reference.title}</A>
							({[reference.draft ? 'Draft' : '', reference.published ? 'Published' : '']
								.filter(Boolean)
								.join(' and ')})
						</P>
					{/each}
					{#if dialog === 'delete'}
						<P role="status"
							>Remove this slide from every listed draft and published playlist before deleting it.
							Save draft changes and publish playlist changes, then reload this editor.</P
						>
					{/if}
				{:else}
					<P>No playlists currently reference this slide.</P>
				{/if}
				{#if form?.error}<P role="alert" class="text-sm text-red-600 dark:text-red-400"
						>{form.error}</P
					>{/if}
				<Form
					action={dialog === 'delete' ? '?/delete' : '?/unpublish'}
					submitFunction={() => {
						managing = true;
						return async ({ update, result }) => {
							try {
								await update();
								if (result.type === 'success') isDialogOpen = false;
							} finally {
								managing = false;
							}
						};
					}}
				>
					<Input type="hidden" name="id" value={data.slide.id} />
					<Input type="hidden" name="version" value={String(data.slide.version)} />
					{#snippet buttons()}
						<Button
							id={`${uid}-dialog-cancel`}
							variants={['contrast']}
							disabled={managing}
							onclick={() => (dialog = 'settings')}>Cancel</Button
						>
						<Button
							type="submit"
							variants={['error']}
							disabled={managing || (dialog === 'delete' && references.length > 0)}
						>
							{managing ? 'Working…' : dialog === 'delete' ? 'Delete permanently' : 'Unpublish'}
						</Button>
					{/snippet}
				</Form>
			{:else if dialog === 'upload'}
				{#if form?.error}<P role="alert" class="text-sm text-red-600 dark:text-red-400"
						>{form.error}</P
					>{/if}
				<Form
					action="?/upload"
					enctype="multipart/form-data"
					submitFunction={() => {
						uploading = true;
						return async ({ update, result }) => {
							try {
								await update();
								if (result.type === 'success') isDialogOpen = false;
							} finally {
								uploading = false;
							}
						};
					}}
				>
					{#snippet inputs()}<Input
							type="file"
							name="file"
							aria-label="Asset file"
							accept="image/png,image/jpeg,image/webp,image/svg+xml"
							required
						/>{/snippet}
					{#snippet buttons()}<Button type="submit" disabled={uploading}
							><Upload size={18} class="mr-2" />{uploading ? 'Uploading…' : 'Upload asset'}</Button
						>{/snippet}
				</Form><P class="text-sm opacity-60"
					>PNG, JPEG, WebP under 3 MB; SVG under 300 KB. Uploading keeps your current slide edits.</P
				>
			{:else}
				{#if dialog === 'import'}<Input
						type="file"
						aria-label="Import JSON file"
						accept="application/json,.json"
						onchange={readJson}
					/><P class="text-sm opacity-60"
						>Choose a JSON file or paste a definition below. Import replaces the current slide
						definition; save it when ready.</P
					>{:else}<P class="text-sm opacity-60"
						>Download or copy this definition. It includes asset IDs from this portal.</P
					>{/if}
				<Textarea
					label="Slide JSON"
					aria-label="Slide JSON"
					bind:value={json}
					readonly={dialog === 'export'}
					rows={12}
				/>
				{#if dialog === 'import'}<Button onclick={importJson}
						><ImportIcon size={18} class="mr-2" />Import from JSON</Button
					>{:else}<Button onclick={downloadJson}
						><Download size={18} class="mr-2" />Download JSON</Button
					>{/if}
			{/if}
		</Div>
	</Modal>
{/if}
