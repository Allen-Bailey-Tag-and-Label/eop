<script lang="ts">
	import {
		Button,
		Card,
		Checkbox,
		DialogActions,
		Div,
		Hr,
		Input,
		Modal,
		P,
		Select,
		Tabs
	} from '$lib/components';
	import { onMount, untrack } from 'svelte';
	import { Editor, getMarkRange } from '@tiptap/core';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import RichTextToolbar from './RichTextToolbar.svelte';

	import { theme } from '$lib/theme';
	import { editorExtensions } from '$lib/rich-text/extensions';
	import { emptyDocument, safeUrl, type RichTextDocument } from '$lib/rich-text/document';
	import type { UploadedPostImage } from '$lib/rich-text/images';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange'> & {
		value?: RichTextDocument;
		editor?: Editor | null;
		disabled?: boolean;
		label?: string;
		class?: string;
		variants?: string[];
		onChange?: (value: RichTextDocument) => void;
		onInsertComponent?: () => void;
		images?: UploadedPostImage[];
		onUploadImage?: (file: File) => Promise<UploadedPostImage>;
	};
	let {
		value = $bindable(emptyDocument()),
		editor = $bindable(null),
		disabled = false,
		label = 'Rich text content',
		class: className,
		variants = [],
		onChange,
		onInsertComponent,
		images = [],
		onUploadImage,
		...restProps
	}: Props = $props();
	let element = $state<HTMLDivElement | null>(null),
		revision = $state(0);
	let dialog = $state<'link' | 'image' | null>(null),
		url = $state(''),
		linkText = $state(''),
		linkAppearance = $state('text'),
		alt = $state(''),
		caption = $state(''),
		width = $state('100'),
		imageAlign = $state('center'),
		error = $state('');
	let linkRange = { from: 0, to: 0 },
		originalLinkText = '';
	let tableDialog = $state(false),
		tableRows = $state('3'),
		tableColumns = $state('3'),
		tableHeader = $state(true),
		tableError = $state('');
	function insertTable() {
		const rows = Number(tableRows),
			cols = Number(tableColumns);
		if (
			!Number.isInteger(rows) ||
			!Number.isInteger(cols) ||
			rows < 1 ||
			rows > 20 ||
			cols < 1 ||
			cols > 20
		) {
			tableError = 'Use 1 to 20 rows and columns.';
			return;
		}
		editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: tableHeader }).run();
		tableDialog = false;
	}
	let imageSource = $state('url'),
		file = $state<File | null>(null),
		uploading = $state(false),
		addedImages = $state<UploadedPostImage[]>([]);
	const availableImages = $derived([
		...new Map([...images, ...addedImages].map((image) => [image.id, image])).values()
	]);
	const previewImageSource = (src: string) =>
		availableImages.find((image) => image.url === src)?.previewUrl ?? src;
	const selection = $derived.by(() => {
		void revision;
		return {
			table: editor?.isActive('table') ?? false
		};
	});
	onMount(() => {
		const instance = new Editor({
			element: element!,
			extensions: editorExtensions(
				$theme.Card.default,
				twMerge($theme.Button.default, $theme.RichTextEditor.buttonLink),
				$theme.A.default,
				previewImageSource
			),
			content: value.doc,
			editable: !disabled,
			editorProps: {
				attributes: {
					role: 'textbox',
					'aria-label': label,
					'aria-multiline': 'true',
					class: 'min-h-72 outline-none'
				}
			},
			onUpdate: ({ editor: current }) => {
				value = { schemaVersion: 1, doc: current.getJSON() };
				onChange?.(value);
			},
			onTransaction: () => {
				revision = untrack(() => revision) + 1;
			}
		});
		editor = instance;
		return () => {
			instance.destroy();
			editor = null;
		};
	});
	$effect(() => {
		const instance = editor,
			editable = !disabled;
		untrack(() => instance?.setEditable(editable, false));
	});
	$effect(() => {
		const instance = editor,
			doc = value.doc,
			serialized = JSON.stringify(doc);
		untrack(() => {
			if (instance && JSON.stringify(instance.getJSON()) !== serialized)
				instance.commands.setContent(doc, { emitUpdate: false });
		});
	});
	function open(kind: 'link' | 'image') {
		dialog = kind;
		error = '';
		imageSource = 'url';
		file = null;
		const attrs = editor?.getAttributes(kind) ?? {};
		url = kind === 'link' ? (attrs.href ?? '') : (attrs.src ?? '');
		if (kind === 'link' && editor) {
			const selection = editor.state.selection;
			linkRange = selection.empty
				? (getMarkRange(selection.$from, editor.schema.marks.link) ?? {
						from: selection.from,
						to: selection.to
					})
				: { from: selection.from, to: selection.to };
			originalLinkText = editor.state.doc.textBetween(linkRange.from, linkRange.to, ' ');
			linkText = originalLinkText;
			linkAppearance = attrs.appearance ?? 'text';
		}
		alt = attrs.alt ?? '';
		caption = attrs.caption ?? '';
		width = String(attrs.width ?? 100);
		imageAlign = attrs.align ?? 'center';
	}
	async function upload() {
		if (!file || !onUploadImage || uploading) return;
		uploading = true;
		error = '';
		try {
			const image = await onUploadImage(file);
			addedImages = [...addedImages, image];
			url = image.url;
			if (!alt) alt = image.name;
			imageSource = 'library';
			file = null;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not upload image.';
		} finally {
			uploading = false;
		}
	}
	function apply() {
		if (!editor || !dialog) return;
		if (!safeUrl(url, dialog === 'image')) {
			error = 'Enter a valid HTTP(S) URL or site path.';
			return;
		}
		if (dialog === 'link') {
			if (!linkText.trim()) {
				error = 'Enter the link text.';
				return;
			}
			const attrs = { href: url, appearance: linkAppearance };
			if (linkRange.from === linkRange.to || linkText !== originalLinkText)
				editor
					.chain()
					.focus()
					.insertContentAt(linkRange, {
						type: 'text',
						text: linkText,
						marks: [{ type: 'link', attrs }]
					})
					.run();
			else editor.chain().focus().setTextSelection(linkRange).setMark('link', attrs).run();
		} else {
			const size = Number(width);
			if (!Number.isInteger(size) || size < 10 || size > 100) {
				error = 'Image width must be 10–100%.';
				return;
			}
			const attrs = { src: url, alt, caption, width: size, align: imageAlign };
			if (editor.isActive('image')) editor.chain().focus().updateAttributes('image', attrs).run();
			else editor.chain().focus().insertContent({ type: 'image', attrs }).run();
		}
		dialog = null;
	}
</script>

<Card
	{...restProps}
	class={twMerge(
		$theme.RichTextEditor.default,
		...variants.map((variant) => $theme.RichTextEditor[variant]),
		className
	)}
>
	<RichTextToolbar
		{editor}
		{revision}
		{disabled}
		onLink={() => open('link')}
		onImage={() => open('image')}
		onTable={() => {
			tableError = '';
			tableDialog = true;
		}}
		onQuestions={onInsertComponent}
	/>
	<Hr class="m-0" />
	<Div class="p-4"><Div bind:element class={$theme.RichTextEditor.content} /></Div>
</Card>
{#if tableDialog}
	<Modal
		closeAriaLabel="Close table settings"
		title="Table settings"
		bind:isOpen={tableDialog}
		role="dialog"
		aria-label="Table settings"
		class="max-h-[90svh] w-full max-w-lg space-y-4 overflow-y-auto p-5"
	>
		{#if selection.table}
			<P>Manage the selected table using the actions below.</P>
		{:else}
			<Div class="grid grid-cols-2 gap-3"
				><Input
					label="Rows"
					aria-label="Table rows"
					type="number"
					min={1}
					max={20}
					bind:value={tableRows}
				/><Input
					label="Columns"
					aria-label="Table columns"
					type="number"
					min={1}
					max={20}
					bind:value={tableColumns}
				/></Div
			>
			<Checkbox label="Header row" bind:checked={tableHeader} />
			{#if tableError}<P role="alert">{tableError}</P>{/if}
		{/if}
		<DialogActions onClose={() => (tableDialog = false)} closeLabel="Done"
			>{#if selection.table}
				<Button onclick={() => editor?.chain().addRowAfter().run()}>Add row</Button>
				<Button onclick={() => editor?.chain().addColumnAfter().run()}>Add column</Button>
				<Button variants={['ghost']} onclick={() => editor?.chain().deleteRow().run()}
					>Remove row</Button
				>
				<Button variants={['ghost']} onclick={() => editor?.chain().deleteColumn().run()}
					>Remove column</Button
				>
				<Button variants={['ghost']} onclick={() => editor?.chain().toggleHeaderRow().run()}
					>Toggle header row</Button
				>
				<Button
					variants={['ghost']}
					onclick={() => {
						editor?.chain().focus().deleteTable().run();
						tableDialog = false;
					}}>Remove table</Button
				>
			{:else}<Button onclick={insertTable}>Insert table</Button>{/if}</DialogActions
		>
	</Modal>
{/if}
{#if dialog}
	<Modal
		closeAriaLabel="Close settings"
		title={dialog === 'link' ? 'Edit link' : 'Image settings'}
		bind:isOpen={
			() => !!dialog,
			(open) => {
				if (!open) dialog = null;
			}
		}
		role="dialog"
		aria-label={dialog === 'link' ? 'Edit link' : 'Image settings'}
		class="max-h-[90svh] w-full max-w-xl space-y-4 overflow-y-auto p-5"
	>
		{#if dialog === 'image'}
			<Tabs
				aria-label="Image source"
				bind:value={imageSource}
				tabs={[
					{ title: 'Upload', value: 'upload' },
					{ title: 'Uploaded images', value: 'library' },
					{ title: 'URL', value: 'url' }
				]}
			/>
			{#if imageSource === 'upload'}
				{#if onUploadImage}
					<Input
						label="Image file"
						aria-label="Image file"
						type="file"
						accept="image/png,image/jpeg,image/webp"
						disabled={uploading}
						onchange={(event) => (file = event.currentTarget.files?.[0] ?? null)}
					/>
					<P class="text-sm opacity-70"
						>PNG, JPEG, or WebP, up to 3 MB. Uploaded images belong to this post.</P
					>
				{:else}<P>Save the post before uploading images.</P>{/if}
			{:else if imageSource === 'library'}
				{#if availableImages.length}<Div class="grid max-h-60 grid-cols-2 gap-3 overflow-auto p-1">
						{#each availableImages as image (image.id)}<Button
								variants={['ghost']}
								aria-pressed={url === image.url}
								onclick={() => (url = image.url)}
								class={twMerge(
									'flex flex-col gap-2',
									url === image.url ? $theme.RichTextEditor.selectedImage : ''
								)}
								><img src={image.previewUrl} alt="" class="h-20 w-full object-contain" /><span
									class="break-all">{image.name}</span
								></Button
							>{/each}
					</Div>{:else}<P>No uploaded images for this post.</P>{/if}
			{:else}<Input label="Image URL" aria-label="URL" bind:value={url} />{/if}
		{:else}<Input label="Link URL" aria-label="URL" bind:value={url} />{/if}
		{#if dialog === 'link'}
			<Input label="Link text" aria-label="Link text" bind:value={linkText} />
			<Select
				label="Appearance"
				aria-label="Link appearance"
				bind:value={linkAppearance}
				options={[
					{ value: 'text', label: 'Text link' },
					{ value: 'button', label: 'Button link' }
				]}
			/>
		{/if}
		{#if dialog === 'image'}<Input label="Alternative text" bind:value={alt} /><Input
				label="Caption"
				bind:value={caption}
			/><Input label="Width (%)" type="number" min={10} max={100} bind:value={width} /><Select
				label="Alignment"
				bind:value={imageAlign}
				options={['left', 'center', 'right'].map((value) => ({ value, label: value }))}
			/>{/if}
		{#if error}<P role="alert">{error}</P>{/if}
		<DialogActions
			>{#if dialog === 'image' && imageSource === 'upload' && onUploadImage}<Button
					disabled={!file || uploading}
					onclick={upload}>{uploading ? 'Uploading...' : 'Upload image'}</Button
				>{/if}<Button disabled={uploading} onclick={apply}>Apply</Button
			>{#if dialog === 'link'}<Button
					variants={['ghost']}
					onclick={() => {
						editor?.chain().focus().setTextSelection(linkRange).unsetLink().run();
						dialog = null;
					}}>Remove link</Button
				>{/if}<Button variants={['ghost']} onclick={() => (dialog = null)}>Cancel</Button
			></DialogActions
		>
	</Modal>
{/if}
