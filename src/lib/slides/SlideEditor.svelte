<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { deserialize } from '$app/forms';
	import {
		ArrowLeft,
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
		FolderOpen,
		RotateCw,
		RotateCcw,
		Undo2,
		AlignLeft,
		AlignCenter,
		AlignRight,
		AlignVerticalJustifyStart,
		AlignVerticalJustifyCenter,
		AlignVerticalJustifyEnd,
		BringToFront,
		Frame,
		Database,
		QrCode
	} from '@lucide/svelte';
	import {
		A,
		Button,
		Card,
		Div,
		Form,
		H1,
		H2,
		Input,
		Modal,
		P,
		Select,
		Tabs,
		Textarea
	} from '$lib/components';
	import SlideWorkspace from './SlideWorkspace.svelte';
	import AddElementMenu from './AddElementMenu.svelte';
	import PaddingEditor from './PaddingEditor.svelte';
	import FrameSettings from './FrameSettings.svelte';
	import LayerTree from './LayerTree.svelte';
	import { frameAt, frameSlide, listFrames, moveLayer } from './frames';

	import ColorField from './ColorField.svelte';
	import InspectorInput from './InspectorInput.svelte';
	import InspectorSection from './InspectorSection.svelte';
	import DataLinkEditor from './DataLinkEditor.svelte';
	import RepeaterSettings from './RepeaterSettings.svelte';
	import VisibilitySettings from './VisibilitySettings.svelte';
	import AssetLibrary from './AssetLibrary.svelte';
	import { allElements, defaultRepeater, templateSlide } from './repeater';
	import type { SlideElement } from './types';
	import {
		newElement,
		defaultBorderColor,
		type AssetSummary,
		type ContentEditor,
		type ElementType,
		type ColorScheme,
		type SlideReference,
		type SlideDefinition,
		type SlideData
	} from './types';
	import { parseJson, validateSlide } from './validation';
	import { moveElement, rotateElement, reorderLayers } from './editor';
	import { withResponsiveDefaults } from './layout';
	import { poseAt } from './timeline';
	let {
		data,
		form
	}: {
		data: {
			slide: ContentEditor<SlideDefinition>;
			assets: AssetSummary[];
			sharedAssets?: AssetSummary[];
			unusedAssets?: AssetSummary[];
			assetScopeId?: string;
			assetSlides?: { id: string; title: string; slug: string }[];
			references?: SlideReference[];
			dataFields?: Record<string, string[]>;
		};
		form?: {
			error?: string;
			success?: string;
			references?: SlideReference[];
			slideData?: SlideData;
		} | null;
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
	let slideData = $state<SlideData>({});
	let assetTab = $state<'slide' | 'shared'>('slide');
	const localAssets = $derived([
		...new Map(
			[
				...data.assets,
				...(data.sharedAssets ?? []).filter((asset) =>
					allElements(draft).some((element) => element.assetId === asset.id)
				)
			].map((asset) => [asset.id, asset])
		).values()
	]);
	const availableAssets = $derived(assetTab === 'shared' ? (data.sharedAssets ?? []) : localAssets);
	const allAvailableAssets = $derived([...data.assets, ...(data.sharedAssets ?? [])]);
	const scopeId = $derived(data.assetScopeId ?? data.slide.id);
	function assetAction(name: string) {
		return `?/${name}${!data.slide.id && scopeId ? `&assetScope=${scopeId}` : ''}`;
	}
	let selectedId = $state('');
	let editingRepeaterId = $state('');
	let previewRow = $state(0);
	const editingRepeater = $derived(
		allElements(draft).find((element) => element.id === editingRepeaterId && element.repeater)
	);
	const rootElements = $derived(editingRepeater?.repeater?.template.elements ?? draft.elements);
	let framePath = $state<string[]>([]);
	let repeaterReturnPath: string[] = [];
	const editingFrame = $derived(frameAt(rootElements, framePath));
	const activeElements = $derived(editingFrame?.frame?.elements ?? rootElements);
	const selected = $derived(activeElements.find((element) => element.id === selectedId));
	const contentLabel = $derived(
		selected?.type === 'qr'
			? 'QR content (URL or text)'
			: selected?.type === 'text'
				? 'Text'
				: selected?.type === 'list' && !selected.repeater
					? 'Heading'
					: 'Description'
	);
	const contentAria = $derived(
		selected?.type === 'qr'
			? 'QR content'
			: selected?.type === 'list'
				? selected.repeater
					? 'Repeater description'
					: 'Data list heading'
				: 'Element text'
	);
	const workingDefinition = $derived(
		editingFrame
			? frameSlide(editingFrame, draft.durationMs)
			: editingRepeater?.repeater
				? templateSlide(editingRepeater.repeater, draft.durationMs)
				: draft
	);
	const templateRows = $derived(slideData[editingRepeaterId]?.items ?? []);
	const currentRow = $derived(
		templateRows[Math.min(previewRow, Math.max(0, templateRows.length - 1))] ?? {
			id: 'example',
			label: 'Label',
			detail: 'Detail'
		}
	);
	function setElements(elements: SlideElement[]) {
		if (editingFrame?.frame) editingFrame.frame.elements = elements;
		else if (editingRepeater?.repeater) editingRepeater.repeater.template.elements = elements;
		else draft.elements = elements;
	}

	let layerAnnouncement = $state('');
	function selectLayer(id: string, path: string[], inspect = true) {
		if (JSON.stringify(framePath) !== JSON.stringify(path)) {
			framePath = [...path];
			fitView();
		}
		selectedId = id;
		playing = false;
		if (inspect) {
			inspectorOpen = true;
			inspectorTab = 'properties';
			if (!window.matchMedia('(min-width: 1024px)').matches) layersOpen = false;
		}
	}
	function reorderAt(path: string[], id: string, target: string, after: boolean) {
		const parent = frameAt(rootElements, path);
		const elements = parent?.frame?.elements ?? rootElements;
		const reordered = reorderLayers(elements, id, target, !after);
		if (reordered === elements) return;
		if (parent?.frame) parent.frame.elements = reordered;
		else if (editingRepeater?.repeater) editingRepeater.repeater.template.elements = reordered;
		else draft.elements = reordered;
		selectLayer(id, path, false);
		layerAnnouncement =
			'Moved layer to position ' +
			(reordered.length - reordered.findIndex((element) => element.id === id)) +
			' of ' +
			reordered.length +
			'.';
	}
	function enterFrame(element = selected) {
		if (!element?.frame) return;
		framePath = [...framePath, element.id];
		selectedId = '';
		playing = false;
		fitView();
	}
	function leaveFrame() {
		const id = framePath.at(-1) ?? '';
		framePath = framePath.slice(0, -1);
		selectedId = id;
		playing = false;
		fitView();
	}

	const frameChoices = $derived(
		listFrames(rootElements, selected?.frame ? [...framePath, selected.id] : [])
	);
	function moveToFrame(
		sourcePath: string[],
		id: string,
		destinationPath: string[],
		targetId?: string,
		after = false
	) {
		try {
			const source = frameAt(rootElements, sourcePath);
			const moved = moveLayer(rootElements, sourcePath, id, destinationPath, {
				baseDepth: editingRepeater ? repeaterReturnPath.length + 1 : 0,
				prepare: (child) => {
					if (source?.frame?.layout === 'free' || !source?.frame) return;
					// A layer drag can start outside the frame currently shown on the canvas.
					if (JSON.stringify(sourcePath) !== JSON.stringify(framePath)) return;
					const root = document.querySelector('[aria-label="Slide workspace"] [data-canvas-root]');
					const node = Array.from(root?.children ?? []).find(
						(node) => node.getAttribute('data-slide-element') === id
					) as HTMLElement | undefined;
					if (node?.clientWidth && node?.clientHeight) {
						moveElement(child, node.offsetLeft - child.x, node.offsetTop - child.y);
						child.width = parseFloat(getComputedStyle(node).width) || node.clientWidth;
						child.height = parseFloat(getComputedStyle(node).height) || node.clientHeight;
						child.layoutSizing = 'fixed';
					}
				}
			});
			if (!moved) return;
			const destination = frameAt(rootElements, destinationPath),
				elements = destination?.frame?.elements ?? rootElements;
			if (targetId) {
				const reordered = reorderLayers(elements, id, targetId, !after);
				elements.splice(0, elements.length, ...reordered);
			}
			localError = '';
			selectLayer(id, destinationPath);
			layerAnnouncement =
				'Moved ' + (moved.text || 'layer') + ' to ' + (destination?.text || 'the root') + '.';
		} catch (cause) {
			localError = cause instanceof Error ? cause.message : 'Could not move this layer.';
		}
	}
	function moveIntoFrame(value: string) {
		try {
			const path = JSON.parse(value);
			if (!Array.isArray(path) || path.some((id) => typeof id !== 'string')) throw Error();
			moveToFrame(framePath, selectedId, path);
		} catch {
			localError = 'Choose a destination frame.';
		}
	}
	function moveOutOfFrame() {
		moveToFrame(framePath, selectedId, framePath.slice(0, -1));
	}
	function editTemplate() {
		const parent = selected;
		if (!parent?.repeater) return;
		const child = parent.repeater.template.elements.find((element) => element.type === 'text');
		repeaterReturnPath = [...framePath];
		framePath = [];
		editingRepeaterId = parent.id;
		selectedId = child?.id ?? '';
		previewRow = 0;
		playing = false;
		fitView();
	}

	function leaveTemplate() {
		const parent = editingRepeaterId;
		editingRepeaterId = '';
		framePath = repeaterReturnPath;
		selectedId = parent;
		playing = false;
		fitView();
	}
	let timeMs = $state(0);
	const previewTiming = $derived({ entranceMs: 0, totalMs: draft.durationMs });
	const contentTimeMs = $derived(timeMs);
	let playing = $state(false);
	let saving = $state(false);
	let uploading = $state(false);
	let managing = $state(false);
	const references = $derived(form?.references ?? data.references ?? []);
	let json = $state('');
	let localError = $state('');

	let previewRevision = $state(0);
	let tool = $state<'select' | 'pan' | 'resize'>('select');
	let zoom = $state(1);
	let resetView = $state(0);
	let previewPreset = $state('reference');
	let previewScheme = $state<ColorScheme>('dark');
	const previewSizes: Record<string, { width: number; height: number }> = {
		wide: { width: 1920, height: 1080 },
		taller: { width: 1920, height: 1200 },
		ultrawide: { width: 2520, height: 1080 },
		portrait: { width: 1080, height: 1920 }
	};
	const viewport = $derived(
		editingFrame || editingRepeater?.repeater
			? {
					width: workingDefinition.width,
					height: workingDefinition.height
				}
			: (previewSizes[previewPreset] ?? { width: draft.width, height: draft.height })
	);
	let inspectorOpen = $state(false);
	let layersOpen = $state(false);
	let fillOpen = $state(true);
	let fillSection = $state<HTMLDetailsElement | null>(null);
	let inspectorTab = $state<'properties' | 'animation'>('properties');
	let dialog = $state<
		'settings' | 'upload' | 'import' | 'export' | 'unpublish' | 'delete' | 'assets'
	>('settings');
	const dialogTitles = {
		settings: 'Slide settings',
		upload: 'Upload an asset',
		assets: 'Asset library',
		import: 'Import slide JSON',
		export: 'Export slide JSON',
		unpublish: 'Unpublish slide?',
		delete: 'Delete slide?'
	};
	let isDialogOpen = $state(false);
	let returnFocus: HTMLElement | null = null;
	let colorInput = $state<HTMLInputElement | null>(null);
	const uid = $props.id();
	const geometry = ['x', 'y', 'width', 'height'] as const;
	const poseFields = ['x', 'y', 'rotation', 'scale', 'opacity'] as const;
	const elementTools = [
		{ type: 'text', label: 'Text', icon: Type },
		{ type: 'qr', label: 'QR code', icon: QrCode },
		{ type: 'image', label: 'Image / Graphic', icon: Image },
		{ type: 'rectangle', label: 'Rectangle', icon: Square },
		{ type: 'ellipse', label: 'Ellipse', icon: Circle },
		{ type: 'line', label: 'Line', icon: Minus },
		{ type: 'list', label: 'Repeater', icon: Database },
		{ type: 'frame', label: 'Frame', icon: Frame }
	] as const;
	const availableTools = $derived(
		editingRepeater ? elementTools.filter((item) => item.type !== 'list') : elementTools
	);
	const dirty = $derived(
		JSON.stringify({ title, slug, draft }) !==
			JSON.stringify({ title: data.slide.title, slug: data.slide.slug, draft: data.slide.draft })
	);
	onMount(() => {
		inspectorOpen = window.matchMedia('(min-width: 1024px)').matches;
		layersOpen = inspectorOpen;
	});
	function showPanel(tab: typeof inspectorTab | 'layers') {
		if (tab === 'layers') {
			layersOpen = true;
			if (!window.matchMedia('(min-width: 1024px)').matches) inspectorOpen = false;
			return;
		}
		inspectorTab = tab;
		inspectorOpen = true;
		if (!window.matchMedia('(min-width: 1024px)').matches) layersOpen = false;
	}
	function addElement(type: ElementType, chosenAsset?: AssetSummary) {
		const element = newElement(type, crypto.randomUUID());
		if (type === 'image' || type === 'svg') {
			const asset =
				chosenAsset ??
				availableAssets.find((asset) =>
					['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(asset.contentType)
				);
			if (!asset) {
				openDialog((data.sharedAssets?.length ?? 0) > 0 ? 'assets' : 'upload');
				localError =
					(data.sharedAssets?.length ?? 0) > 0
						? 'Choose a shared asset or upload an asset to this slide.'
						: 'Upload an image or SVG asset first, then add it to the slide or item template.';
				return;
			}
			element.assetId = asset.id;
			element.type = asset.contentType === 'image/svg+xml' ? 'svg' : 'image';
		}
		if (type === 'list') {
			element.repeater = defaultRepeater();
			element.text = 'Repeater';
		}
		if (editingFrame || editingRepeater?.repeater) {
			element.x = 20;
			element.y = 20;
			element.width = Math.max(1, workingDefinition.width - 40);
			element.height = Math.min(type === 'frame' ? 300 : 80, workingDefinition.height);
			element.fontSize = 32;
			if (type === 'qr')
				element.width = element.height = Math.max(
					1,
					Math.min(320, workingDefinition.width - 40, workingDefinition.height - 40)
				);
		}
		if (editingFrame?.frame && editingFrame.frame.layout !== 'free') {
			element.layoutSizing = 'fill';
			element.width = workingDefinition.width;
		}
		activeElements.push(element);
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
			framePath = [];
			repeaterReturnPath = [];
			editingRepeaterId = '';
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
		fillOpen = true;
		await tick();
		if (fillSection) fillSection.open = true;
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
		if (!selected || selected.keyframes.some((frame) => frame.atMs === Math.round(contentTimeMs)))
			return;
		selected.keyframes.push({
			x: selected.x,
			y: selected.y,
			opacity: selected.opacity,
			rotation: selected.rotation,
			scale: selected.scale,
			atMs: Math.round(contentTimeMs),
			easing: 'linear'
		});
		selected.keyframes.sort((a, b) => a.atMs - b.atMs);
	}
	$effect(() => {
		if (!playing) return;
		const duration = previewTiming.totalMs;
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
	const dataSourceSignature = $derived(
		JSON.stringify(
			allElements(draft)
				.filter((element) => element.type === 'list')
				.map(({ id, dataSource, repeater }) => ({ id, dataSource, templateMode: !!repeater }))
		)
	);
	$effect(() => {
		const signature = dataSourceSignature;
		void previewRevision;
		slideData = {};
		if (signature === '[]') return;
		const controller = new AbortController();
		let disposed = false;
		const timer = setTimeout(async () => {
			const timeout = setTimeout(() => controller.abort(), 10000);
			try {
				const fields = new FormData();
				fields.set('definition', JSON.stringify($state.snapshot(draft)));
				const response = await fetch('?/preview', {
					method: 'POST',
					headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
					body: fields,
					signal: controller.signal,
					cache: 'no-store'
				});
				let result: ReturnType<typeof deserialize>;
				try {
					result = deserialize(await response.text());
				} catch {
					throw new Error(
						`Preview returned an unexpected response (HTTP ${response.status}). Retry or sign in again.`
					);
				}
				if (disposed) return;
				if (result.type !== 'success' || !result.data?.slideData)
					throw new Error(
						result.type === 'failure' && typeof result.data?.error === 'string'
							? result.data.error
							: `Could not load preview (HTTP ${response.status}). Retry or sign in again.`
					);
				slideData = result.data.slideData as SlideData;
			} catch (cause) {
				if (!disposed)
					slideData = Object.fromEntries(
						JSON.parse(signature).map(({ id }: { id: string }) => [
							id,
							{
								state: 'error',
								items: [],
								message: controller.signal.aborted
									? 'Preview request timed out. Retry the data preview.'
									: cause instanceof Error
										? cause.message
										: 'Could not load preview. Retry the data preview.'
							}
						])
					);
			} finally {
				clearTimeout(timeout);
			}
		}, 400);
		return () => {
			disposed = true;
			clearTimeout(timer);
			controller.abort();
		};
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
		<AddElementMenu tools={availableTools} onAdd={addElement} />
		<Button
			aria-label="Settings"
			title="Slide settings"
			variants={['ghost']}
			class="h-9 shrink-0 items-center gap-2 px-2 py-1 text-sm"
			onclick={() => openDialog('settings')}
			><Settings size={18} /><span class="hidden md:inline">Settings</span></Button
		>
		<Button
			aria-label="Asset library"
			title="Asset library"
			variants={['ghost']}
			class="h-9 shrink-0 items-center gap-2 px-2 py-1 text-sm"
			onclick={() => openDialog('assets')}
			><FolderOpen size={18} /><span class="hidden lg:inline">Assets</span></Button
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
			action={assetAction('save')}
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
			<Input type="hidden" name="assetScopeId" value={scopeId} /><Input
				type="hidden"
				name="id"
				value={data.slide.id}
			/><Input type="hidden" name="version" value={String(data.slide.version)} /><Input
				type="hidden"
				name="definition"
				value={JSON.stringify(draft)}
			/><Input type="hidden" name="title" value={title} /><Input
				type="hidden"
				name="slug"
				value={slug}
			/>
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
			title="Properties and animation"
			aria-pressed={inspectorOpen}
			variants={['ghost']}
			class="h-9 w-9 shrink-0 items-center p-0"
			onclick={() => {
				inspectorOpen = !inspectorOpen;
				if (inspectorOpen && !window.matchMedia('(min-width: 1024px)').matches) layersOpen = false;
			}}><SlidersHorizontal size={18} /></Button
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
	{#if editingRepeater}
		<Div
			class="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-300 px-3 py-2 dark:border-gray-700"
			aria-label="Item template editing"
		>
			<Button onclick={leaveTemplate}>Back to slide</Button>
			<P class="text-sm font-semibold">Editing repeater item template</P>
			<Input
				label="Preview row"
				aria-label="Preview row"
				type="number"
				min={1}
				max={Math.max(1, templateRows.length)}
				value={String(previewRow + 1)}
				oninput={(event) => (previewRow = Math.max(0, Number(event.currentTarget.value) - 1))}
			/>
		</Div>
	{/if}
	{#if editingFrame}
		<Div
			class="flex shrink-0 items-center gap-3 border-b border-current/15 px-3 py-2"
			aria-label="Frame editing"
		>
			<Button onclick={leaveFrame}>Back to parent</Button><P class="text-sm font-semibold"
				>Editing frame: {editingFrame.text}</P
			>
		</Div>
	{/if}
	<Div class="relative flex min-h-0 flex-1 overflow-hidden">
		{#if layersOpen}
			<Div
				role="region"
				aria-label="Layers panel"
				class="absolute inset-y-0 left-0 z-2 flex w-64 max-w-[75%] shrink-0 flex-col border-r border-slate-300 bg-white shadow-lg lg:static lg:max-w-none lg:shadow-none dark:border-gray-700 dark:bg-gray-900"
			>
				<Div
					class="flex shrink-0 items-center justify-between gap-2 border-b border-slate-300 p-3 dark:border-gray-700"
					><H2 class="text-sm">Layers</H2><Button
						aria-label="Close layers panel"
						variants={['ghost']}
						class="h-7 w-7 items-center p-0"
						onclick={() => (layersOpen = false)}><X size={15} /></Button
					></Div
				>
				<Div class="min-h-0 space-y-2 overflow-y-auto p-3"
					><P class="text-xs opacity-60"
						>Top layers are in front. Drop on a frame's center to move inside; drop at an edge to
						reorder. Alt+Up/Down moves one layer.</P
					><P role="status" aria-live="polite" class="sr-only">{layerAnnouncement}</P>
					<LayerTree
						elements={rootElements}
						selectedPath={framePath}
						{selectedId}
						onSelect={selectLayer}
						onReorder={reorderAt}
						onMove={moveToFrame}
					/>
					{#if !rootElements.length}<P class="text-xs opacity-60"
							>Add an element or frame to start.</P
						>{/if}
				</Div></Div
			>{/if}
		<Div class="relative min-h-0 min-w-0 flex-1 pb-20">
			<SlideWorkspace
				flow={editingFrame?.frame}
				definition={workingDefinition}
				bind:selectedId
				timeMs={editingRepeater || editingFrame ? contentTimeMs : timeMs}
				{tool}
				scheme={previewScheme}
				data={slideData}
				row={editingRepeater ? currentRow : undefined}
				rowIndex={previewRow}
				timeZone={editingRepeater?.dataSource?.timeZone ?? 'America/New_York'}
				{zoom}
				{resetView}
				viewportWidth={viewport.width}
				viewportHeight={viewport.height}
				onEdit={() => {
					playing = false;
				}}
			/>
			<Div
				class="pointer-events-none absolute right-3 bottom-24 left-3 flex items-end justify-between gap-2 text-xs"
				><span
					class="rounded bg-white/85 px-2 py-1 text-slate-700 dark:bg-gray-900/85 dark:text-gray-300"
					>{viewport.width} × {viewport.height} · {activeElements.length} elements</span
				><span
					class="hidden rounded bg-white/85 px-2 py-1 text-slate-700 lg:block dark:bg-gray-900/85 dark:text-gray-300"
					>{tool === 'pan'
						? 'Drag to pan the canvas'
						: tool === 'resize'
							? 'Drag any corner or side handle to resize'
							: 'Drag elements to move · Arrow keys to nudge'}</span
				></Div
			>
			<Div class="pointer-events-none absolute inset-x-0 bottom-3 z-1 flex justify-center px-3"
				><Card
					role="toolbar"
					aria-label="Canvas tools"
					class="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto p-2"
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
						disabled={!selected || selected.type === 'image' || selected.type === 'svg'}
						variants={['ghost']}
						class="h-9 w-9 shrink-0 items-center p-0"
						onclick={editColor}><Palette size={18} /></Button
					>
					<Div class="mx-1 h-6 shrink-0 border-l border-slate-300 dark:border-gray-700"></Div>
					{#each availableTools as item (item.type)}<Button
							aria-label={`Add ${item.label.toLowerCase()}`}
							title={`Add ${item.label.toLowerCase()}`}
							variants={['ghost']}
							class="h-9 w-9 shrink-0 items-center p-0"
							onclick={() => addElement(item.type)}><item.icon size={18} /></Button
						>{/each}
					<Div class="mx-1 h-6 shrink-0 border-l border-slate-300 dark:border-gray-700"></Div>
					<Button
						aria-label="Show layers"
						aria-pressed={layersOpen}
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
							setElements(activeElements.filter((element) => element.id !== selectedId));
							selectedId = '';
						}}><Trash2 size={18} /></Button
					>
				</Card></Div
			></Div
		>
		{#if inspectorOpen}
			<Div
				class="absolute top-0 right-0 bottom-0 z-2 flex w-72 max-w-[calc(100%_-_3rem)] shrink-0 flex-col border-l border-slate-300 bg-white shadow-lg lg:static lg:shadow-none dark:border-gray-700 dark:bg-gray-900"
				aria-label="Inspector"
			>
				<Div
					class="flex shrink-0 items-center gap-1 border-b border-slate-300 p-2 dark:border-gray-700"
				>
					<Tabs class="min-w-0 flex-1" bind:value={inspectorTab}
						>{#each ['properties', 'animation'] as tab (tab)}<Button
								aria-pressed={inspectorTab === tab}
								variants={inspectorTab === tab ? [] : ['ghost']}
								class="min-w-0 flex-1 px-2 py-1 text-xs capitalize"
								onclick={() => (inspectorTab = tab as typeof inspectorTab)}>{tab}</Button
							>{/each}</Tabs
					>
					<Button
						aria-label="Close properties panel"
						variants={['ghost']}
						class="h-7 w-7 shrink-0 items-center p-0"
						onclick={() => (inspectorOpen = false)}><X size={15} /></Button
					>
				</Div>
				<Div
					class="slide-inspector-controls min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3"
				>
					{#if !selected}<P class="text-sm opacity-60"
							>Select an element on the canvas or in Layers to edit its properties and animation.</P
						>
					{:else if inspectorTab === 'properties'}
						<Div class="flex items-center justify-between px-1"
							><H2 class="text-xs font-semibold">Element properties</H2><Button
								aria-label="Bring to front"
								title="Bring to front"
								variants={['ghost']}
								class="h-7 w-7 items-center p-0"
								onclick={() => {
									if (selected)
										setElements([
											...activeElements.filter((item) => item.id !== selected.id),
											selected
										]);
								}}><BringToFront size={14} /></Button
							></Div
						>
						<InspectorSection title="Position" open>
							<Div class="grid grid-cols-2 gap-2">
								{#each geometry as field (field)}<InspectorInput
										label={field}
										disabled={Boolean(
											editingFrame?.frame &&
												editingFrame.frame.layout !== 'free' &&
												(field === 'x' || field === 'y')
										)}
										prefix={{ x: 'X', y: 'Y', width: 'W', height: 'H' }[field]}
										type="number"
										step={0.1}
										value={String(selected[field])}
										oninput={(event) => {
											if (selected) selected[field] = Number(event.currentTarget.value);
										}}
									/>{/each}
							</Div>
							<Div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
								<InspectorInput
									label="Rotation (degrees)"
									prefix="R"
									unit="deg"
									type="number"
									min={-3600}
									max={3600}
									step={1}
									value={String(poseAt(selected, contentTimeMs).rotation)}
									oninput={(event) => {
										if (selected)
											rotateElement(
												selected,
												Number(event.currentTarget.value) - poseAt(selected, contentTimeMs).rotation
											);
									}}
								/>
								<Div class="flex gap-0.5" role="group" aria-label="Rotation shortcuts">
									<Button
										aria-label="Rotate left 90 degrees"
										title="Rotate left 90 degrees"
										variants={['ghost']}
										class="h-7 w-7 items-center p-0"
										onclick={() => {
											if (selected) rotateElement(selected, -90);
										}}><RotateCcw size={14} /></Button
									>
									<Button
										aria-label="Rotate right 90 degrees"
										title="Rotate right 90 degrees"
										variants={['ghost']}
										class="h-7 w-7 items-center p-0"
										onclick={() => {
											if (selected) rotateElement(selected, 90);
										}}><RotateCw size={14} /></Button
									>
									<Button
										aria-label="Reset object rotation"
										title="Reset rotation"
										variants={['ghost']}
										class="h-7 w-7 items-center p-0"
										onclick={() => {
											if (selected)
												rotateElement(selected, -poseAt(selected, contentTimeMs).rotation);
										}}><Undo2 size={14} /></Button
									>
								</Div></Div
							>
						</InspectorSection>
						<InspectorSection title="Appearance" open>
							<Div class="grid grid-cols-2 gap-2">
								<InspectorInput
									label="scale"
									prefix="S"
									unit="%"
									type="number"
									min={0}
									max={1000}
									step={1}
									value={String(selected.scale * 100)}
									oninput={(event) => {
										if (selected) selected.scale = Number(event.currentTarget.value) / 100;
									}}
								/>
								<InspectorInput
									label="opacity"
									prefix="O"
									unit="%"
									type="number"
									min={0}
									max={100}
									step={1}
									value={String(selected.opacity * 100)}
									oninput={(event) => {
										if (selected) selected.opacity = Number(event.currentTarget.value) / 100;
									}}
								/>
								{#if ['text', 'image', 'svg', 'rectangle', 'frame'].includes(selected.type)}<InspectorInput
										label="Corner radius"
										prefix="R"
										type="number"
										min={0}
										max={512}
										value={String(selected.borderRadius ?? 0)}
										oninput={(event) => {
											if (selected) selected.borderRadius = Number(event.currentTarget.value);
										}}
									/>{/if}
							</Div>
						</InspectorSection>
						<InspectorSection title="Padding" open
							><PaddingEditor bind:value={selected.padding} /></InspectorSection
						>
						<InspectorSection title="Layer parent" open>
							<Select
								aria-label="Move into frame"
								value=""
								options={[
									{ value: '', label: 'Move into frame…' },
									{ value: '[]', label: editingRepeater ? 'Template root' : 'Slide root' },
									...frameChoices.map((item) => ({
										value: JSON.stringify(item.path),
										label: item.label
									}))
								]}
								onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
									if (event.currentTarget.value) moveIntoFrame(event.currentTarget.value);
								}}
							/>
							{#if editingFrame}<Button onclick={moveOutOfFrame}>Move out of frame</Button>{/if}
						</InspectorSection>
						{#if editingFrame?.frame && editingFrame.frame.layout !== 'free'}
							<Select
								label="Layout sizing"
								aria-label="Layout sizing"
								value={selected.layoutSizing ??
									(editingFrame.frame.layout === 'grid' ? 'fill' : 'fixed')}
								options={[
									{ value: 'fixed', label: 'Fixed size' },
									{ value: 'fill', label: 'Fill available space' }
								]}
								onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
									if (selected)
										selected.layoutSizing = event.currentTarget.value as 'fixed' | 'fill';
								}}
							/>
						{/if}
						{#if selected.frame}
							<InspectorSection title="Frame" open>
								<Input label="Name" aria-label="Frame name" bind:value={selected.text} />
								<Button onclick={() => enterFrame()}>Edit frame contents</Button>
								<FrameSettings bind:settings={selected.frame} />
							</InspectorSection>
						{/if}
						{#if selected.type === 'text' || (selected.type === 'list' && !selected.repeater)}
							<InspectorSection title="Typography" open>
								<Textarea
									label={contentLabel}
									aria-label={contentAria}
									bind:value={selected.text}
									rows={2}
								/>
								<Select
									aria-label="Font"
									title="Font family"
									bind:value={selected.fontFamily}
									options={['sans-serif', 'serif', 'monospace'].map((value) => ({
										value,
										label: value
									}))}
								/>
								<Div class="grid grid-cols-2 gap-2">
									<InspectorInput
										label="Font size"
										prefix="Aa"
										type="number"
										min={8}
										max={500}
										value={String(selected.fontSize)}
										oninput={(event) => {
											if (selected) selected.fontSize = Number(event.currentTarget.value);
										}}
									/>
									<Select
										aria-label="Font weight"
										title="Font weight"
										value={String(selected.fontWeight ?? 400)}
										options={[
											{ value: '400', label: 'Normal' },
											{ value: '600', label: 'Semibold' },
											{ value: '700', label: 'Bold' }
										]}
										onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
											if (selected)
												selected.fontWeight = Number(event.currentTarget.value) as 400 | 600 | 700;
										}}
									/>
								</Div>
								<Div class="flex gap-1" role="group" aria-label="Text alignment">
									{#each [{ value: 'left', label: 'Left', icon: AlignLeft }, { value: 'center', label: 'Center', icon: AlignCenter }, { value: 'right', label: 'Right', icon: AlignRight }] as item (item.value)}<Button
											aria-label={`Align text ${item.value}`}
											title={`Align ${item.value}`}
											aria-pressed={selected.align === item.value}
											variants={selected.align === item.value ? [] : ['ghost']}
											class="h-7 flex-1 items-center p-0"
											onclick={() => {
												if (selected) selected.align = item.value as SlideElement['align'];
											}}><item.icon size={14} /></Button
										>{/each}
								</Div>
								{#if selected.type === 'text'}
									<Div class="flex gap-1" role="group" aria-label="Text vertical alignment">
										{#each [{ value: 'top', icon: AlignVerticalJustifyStart }, { value: 'middle', icon: AlignVerticalJustifyCenter }, { value: 'bottom', icon: AlignVerticalJustifyEnd }] as item (item.value)}
											<Button
												aria-label={`Align text ${item.value}`}
												title={`Align ${item.value}`}
												aria-pressed={(selected.verticalAlign ?? 'top') === item.value}
												variants={(selected.verticalAlign ?? 'top') === item.value ? [] : ['ghost']}
												class="h-7 flex-1 items-center p-0"
												onclick={() => {
													if (selected)
														selected.verticalAlign = item.value as SlideElement['verticalAlign'];
												}}><item.icon size={14} /></Button
											>
										{/each}
									</Div>
								{/if}
							</InspectorSection>
						{:else if selected.type === 'image' || selected.type === 'svg'}<InspectorSection
								title="Graphic"
								open
								><Textarea
									label={contentLabel}
									aria-label={contentAria}
									bind:value={selected.text}
									rows={2}
								/>
								<Div class="flex gap-2" role="group" aria-label="Graphic asset source">
									<Button
										aria-pressed={assetTab === 'slide'}
										variants={assetTab === 'slide' ? [] : ['ghost']}
										onclick={() => (assetTab = 'slide')}>This slide</Button
									>
									<Button
										aria-pressed={assetTab === 'shared'}
										variants={assetTab === 'shared' ? [] : ['ghost']}
										onclick={() => (assetTab = 'shared')}>Shared library</Button
									>
								</Div>
								<Select
									label="Asset"
									aria-label="Graphic asset"
									value={selected.assetId}
									onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
										if (!selected) return;
										const asset = allAvailableAssets.find(
											(asset) => asset.id === event.currentTarget.value
										);
										selected.assetId = asset?.id ?? '';
										if (asset)
											selected.type = asset.contentType === 'image/svg+xml' ? 'svg' : 'image';
									}}
									options={[
										{ value: '', label: 'Choose an asset' },
										...availableAssets.map((asset) => ({ value: asset.id, label: asset.name }))
									]}
								/>
								<Select
									label="Image fit"
									aria-label="Image fit"
									bind:value={selected.fit}
									options={['contain', 'cover'].map((value) => ({ value, label: value }))}
								/>
								<Input
									label="Image opacity (%)"
									aria-label="Image opacity"
									class="h-8 text-xs"
									type="number"
									min={0}
									max={100}
									step={1}
									value={String(Math.round((selected.imageOpacity ?? 1) * 100))}
									oninput={(event) => {
										const value = event.currentTarget.valueAsNumber;
										if (selected && Number.isFinite(value))
											selected.imageOpacity = Math.max(0, Math.min(100, value)) / 100;
									}}
								/>
							</InspectorSection>
						{:else}<InspectorSection title="Content" open={selected.type === 'qr'}
								><Textarea
									label={contentLabel}
									aria-label={contentAria}
									bind:value={selected.text}
									rows={2}
								/></InspectorSection
							>{/if}
						{#if selected.type === 'qr'}
							<InspectorSection title="QR settings" open>
								<Select
									label="Error correction"
									aria-label="QR error correction"
									value={selected.qrCorrection ?? 'M'}
									options={['L', 'M', 'Q', 'H'].map((value) => ({ value, label: value }))}
									onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
										if (selected)
											selected.qrCorrection = event.currentTarget.value as 'L' | 'M' | 'Q' | 'H';
									}}
								/>
								<ColorField
									compact
									label="QR background"
									ariaLabel="QR background"
									scheme={previewScheme}
									value={selected.backgroundColor ?? '#ffffff'}
									onValueChange={(value) => {
										if (selected) selected.backgroundColor = value;
									}}
								/>
								<P class="text-xs opacity-60"
									>Use high contrast, leave a clear margin, and test scanning at the monitor's
									viewing distance.</P
								>
							</InspectorSection>
						{/if}
						{#if selected.type !== 'image' && selected.type !== 'svg'}<InspectorSection
								title="Fill"
								bind:open={fillOpen}
								bind:element={fillSection}
							>
								<ColorField
									compact
									bind:element={colorInput}
									ariaLabel="Element color"
									label={selected.type === 'text' ? 'Text color' : 'Color'}
									value={selected.color}
									scheme={previewScheme}
									onValueChange={(value) => {
										if (selected) selected.color = value;
									}}
								/>
								{#if selected.type === 'text'}
									<Select
										aria-label="Text background"
										title="Text background"
										value={selected.backgroundColor && selected.backgroundColor !== 'transparent'
											? 'color'
											: 'transparent'}
										options={[
											{ value: 'transparent', label: 'Transparent background' },
											{ value: 'color', label: 'Colored background' }
										]}
										onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
											if (selected)
												selected.backgroundColor =
													event.currentTarget.value === 'transparent'
														? 'transparent'
														: { light: '#ffffff', dark: '#111827' };
										}}
									/>
									{#if selected.backgroundColor && selected.backgroundColor !== 'transparent'}<ColorField
											compact
											label="Background"
											ariaLabel="Text box background"
											value={selected.backgroundColor}
											scheme={previewScheme}
											onValueChange={(value) => {
												if (selected) selected.backgroundColor = value;
											}}
										/>{/if}
								{/if}
							</InspectorSection>{/if}
						<InspectorSection title="Stroke" open={(selected.borderWidth ?? 0) > 0}>
							<Div class="grid grid-cols-2 gap-2">
								<InspectorInput
									label="Border width"
									prefix="W"
									type="number"
									min={0}
									max={128}
									step={1}
									value={String(selected.borderWidth ?? 0)}
									oninput={(event) => {
										if (selected) selected.borderWidth = Number(event.currentTarget.value);
									}}
								/>
								<Select
									aria-label="Border style"
									title="Border style"
									value={selected.borderStyle ?? 'solid'}
									options={['solid', 'dashed', 'dotted', 'double'].map((value) => ({
										value,
										label: value
									}))}
									onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
										if (selected)
											selected.borderStyle = event.currentTarget.value as NonNullable<
												SlideElement['borderStyle']
											>;
									}}
								/>
							</Div>
							<ColorField
								compact
								label="Color"
								ariaLabel="Object border color"
								value={selected.borderColor ?? defaultBorderColor}
								scheme={previewScheme}
								onValueChange={(value) => {
									if (selected) selected.borderColor = value;
								}}
							/>
						</InspectorSection>
						<InspectorSection title="Responsive anchoring"
							><Select
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
								>Anchors preserve the reference design and control other screen shapes. Scale
								follows screen proportions; edge and center anchors keep spacing and size
								proportional. Opposite edges stretch the box. X/Y are reference coordinates.</P
							></InspectorSection
						>

						{#if editingRepeater && (selected.type === 'text' || selected.type === 'qr')}<InspectorSection
								title="Data binding"
								open
							>
								<Select
									label={selected.type === 'qr' ? 'QR data binding' : 'Text data binding'}
									aria-label={selected.type === 'qr' ? 'QR data binding' : 'Text data binding'}
									value={selected.binding?.field ?? ''}
									options={[
										{ value: '', label: 'Static text' },
										{ value: 'label', label: 'Label (legacy mapping)' },
										{ value: 'detail', label: 'Detail (legacy mapping)' },
										{ value: '$index', label: 'Row number' },
										...(
											editingRepeater.dataSource?.select.trim().split(/\s+/).filter(Boolean) ?? []
										).map((field) => ({ value: `row.${field}`, label: `row.${field}` }))
									]}
									onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
										if (selected)
											selected.binding = event.currentTarget.value
												? { field: event.currentTarget.value, format: 'text', fallback: '' }
												: undefined;
									}}
								/>
								{#if selected.binding}
									<Select
										label="Binding format"
										aria-label="Binding format"
										bind:value={selected.binding.format}
										options={['text', 'date', 'number'].map((value) => ({ value, label: value }))}
									/>
									<Input
										label="Binding fallback"
										aria-label="Binding fallback"
										bind:value={selected.binding.fallback}
									/>
								{/if}
							</InspectorSection>{/if}
						{#if selected.type === 'list' && selected.dataSource}<InspectorSection
								title="Data link"
								open
							>
								<DataLinkEditor
									bind:link={selected.dataSource}
									templateMode={!!selected.repeater}
									fields={data.dataFields?.[selected.dataSource.model] ?? []}
								/>
								<Button onclick={() => previewRevision++}>Refresh data preview</Button>
							</InspectorSection>{#if selected.repeater}<InspectorSection
									title="Repeater layout"
									open
								>
									<RepeaterSettings
										bind:settings={selected.repeater}
										width={selected.width}
										height={selected.height}
										count={slideData[selected.id]?.items.length ?? 0}
									/>
									<Button onclick={editTemplate}>Edit item template</Button>
								</InspectorSection>{:else}<Button
									onclick={() => {
										if (selected) selected.repeater = defaultRepeater();
									}}>Convert to grid repeater</Button
								>{/if}
						{/if}
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
									label="Display time (ms)"
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
				>{(timeMs / 1000).toFixed(1)} / {(previewTiming.totalMs / 1000).toFixed(1)}s</P
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
			<Select
				aria-label="Preview color mode"
				title="Preview color mode"
				class="h-8 w-32 px-2 py-1 text-xs"
				bind:value={previewScheme}
				options={[
					{ value: 'light', label: 'Light preview' },
					{ value: 'dark', label: 'Dark preview' }
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
				max={previewTiming.totalMs}
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
						>{((previewTiming.totalMs * fraction) / 1000).toFixed(1)}s</span
					>{/each}
				{#if selected}{#each selected.keyframes as frame, index (frame)}<Button
							aria-label={`Keyframe ${index + 1} at ${frame.atMs} milliseconds`}
							title={`Keyframe ${index + 1} · ${(frame.atMs / 1000).toFixed(2)}s into display`}
							variants={['ghost']}
							class="absolute -top-2 h-4 w-4 -translate-x-1/2 items-center p-0 text-sky-600"
							style={`left:${Math.max(0, Math.min(100, ((previewTiming.entranceMs + frame.atMs) / previewTiming.totalMs) * 100))}%;`}
							onclick={() => {
								playing = false;
								timeMs = previewTiming.entranceMs + frame.atMs;
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
					/><ColorField
						label="Background"
						ariaLabel="Slide background"
						scheme={previewScheme}
						value={draft.background === 'transparent' ? backgroundColor : draft.background}
						disabled={draft.background === 'transparent'}
						onValueChange={(value) => {
							backgroundColor = value;
							draft.background = backgroundColor;
						}}
					/><Input
						label="Display duration (seconds)"
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
				<P class="font-semibold">Slide visibility</P>
				<VisibilitySettings bind:value={draft.visibility} elements={allElements(draft)} />
				<P class="text-xs opacity-60"
					>Transitions between slides are configured in the playlist. This timeline shows the fully
					visible display period.</P
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
			{:else if dialog === 'assets'}
				{#if form?.error}<P role="alert" class="text-sm text-red-600 dark:text-red-400"
						>{form.error}</P
					>{/if}
				{#if form?.success}<P role="status" class="text-sm">{form.success}</P>{/if}
				<AssetLibrary
					onUpload={() => openDialog('upload')}
					usedAssetIds={allElements(draft)
						.map((element) => element.assetId)
						.filter(Boolean)}
					assets={localAssets}
					sharedAssets={data.sharedAssets ?? []}
					unusedAssets={(data.unusedAssets ?? []).filter(
						(asset) => !allElements(draft).some((element) => element.assetId === asset.id)
					)}
					slides={data.assetSlides ?? []}
					{scopeId}
					action={assetAction('asset')}
					onChoose={(asset) => {
						addElement('image', asset);
						closeDialog();
					}}
				/>
			{:else if dialog === 'upload'}
				{#if form?.error}<P role="alert" class="text-sm text-red-600 dark:text-red-400"
						>{form.error}</P
					>{/if}
				<Form
					action={assetAction('upload')}
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
					{#snippet inputs()}<Input type="hidden" name="assetScopeId" value={scopeId} /><Input
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

<style>
	:global(
		.slide-inspector-controls
			input:not([type='hidden']):not([type='color']):not([type='checkbox']):not([type='radio'])
	),
	:global(.slide-inspector-controls select) {
		min-height: 0;
		height: 2rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		font-size: 0.75rem;
		line-height: 1rem;
	}
	:global(.slide-inspector-controls select) {
		padding-left: 0.5rem;
		padding-right: 1.5rem;
		min-width: 0;
	}
	:global(.slide-inspector-controls textarea) {
		min-height: 3.5rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		line-height: 1.25rem;
	}
	:global(.slide-inspector-controls label) {
		margin: 0;
		font-size: 0.6875rem;
		line-height: 1rem;
	}
	:global(.slide-inspector-controls button) {
		font-size: 0.75rem;
	}
	:global(.slide-inspector-controls button:not([title])) {
		min-height: 1.75rem;
		padding: 0.25rem 0.5rem;
		line-height: 1rem;
	}
	:global(.slide-inspector-controls input[type='number']) {
		appearance: textfield;
		-moz-appearance: textfield;
	}
	:global(.slide-inspector-controls input[type='number']::-webkit-inner-spin-button),
	:global(.slide-inspector-controls input[type='number']::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
