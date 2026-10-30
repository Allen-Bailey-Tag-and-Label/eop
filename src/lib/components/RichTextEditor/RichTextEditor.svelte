<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import {
		Bold,
		Italic,
		Underline,
		Strikethrough,
		List,
		ListOrdered,
		Undo2,
		Redo2,
		Link,
		Image,
		Table,
		X,
		AlignLeft,
		AlignCenter,
		AlignRight
	} from '@lucide/svelte';
	import { Button, Card, Div, H2, Input, Modal, P, Select } from '$lib/components';
	import { theme } from '$lib/theme';
	import { editorExtensions } from '$lib/rich-text/extensions';
	import { emptyDocument, safeUrl, type RichTextDocument } from '$lib/rich-text/document';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange'> & {
		value?: RichTextDocument;
		editor?: Editor | null;
		disabled?: boolean;
		label?: string;
		class?: string;
		variants?: string[];
		onChange?: (value: RichTextDocument) => void;
		onInsertComponent?: () => void;
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
		...restProps
	}: Props = $props();
	let element = $state<HTMLDivElement | null>(null),
		revision = $state(0);
	let dialog = $state<'link' | 'image' | null>(null),
		url = $state(''),
		alt = $state(''),
		caption = $state(''),
		width = $state('100'),
		imageAlign = $state('center'),
		error = $state('');
	const selection = $derived.by(() => {
		void revision;
		return {
			bold: editor?.isActive('bold'),
			italic: editor?.isActive('italic'),
			underline: editor?.isActive('underline'),
			strike: editor?.isActive('strike'),
			bulletList: editor?.isActive('bulletList'),
			orderedList: editor?.isActive('orderedList'),
			heading: String(editor?.getAttributes('heading').level ?? 0),
			undo: editor?.can().undo() ?? false,
			redo: editor?.can().redo() ?? false,
			table: editor?.isActive('table') ?? false
		};
	});
	onMount(() => {
		const instance = new Editor({
			element: element!,
			extensions: editorExtensions($theme.Card.default),
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
		const attrs = editor?.getAttributes(kind) ?? {};
		url = kind === 'link' ? (attrs.href ?? '') : (attrs.src ?? '');
		alt = attrs.alt ?? '';
		caption = attrs.caption ?? '';
		width = String(attrs.width ?? 100);
		imageAlign = attrs.align ?? 'center';
	}
	function apply() {
		if (!editor || !dialog) return;
		if (!safeUrl(url, dialog === 'image')) {
			error = 'Enter a valid HTTP(S) URL or site path.';
			return;
		}
		if (dialog === 'link') {
			if (editor.state.selection.empty && !editor.isActive('link'))
				editor
					.chain()
					.focus()
					.insertContent({
						type: 'text',
						text: url,
						marks: [{ type: 'link', attrs: { href: url } }]
					})
					.run();
			else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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

<Div
	{...restProps}
	class={twMerge(
		$theme.RichTextEditor.default,
		...variants.map((variant) => $theme.RichTextEditor[variant]),
		className
	)}
>
	<Card class="flex flex-wrap items-center gap-1 p-2" role="toolbar" aria-label="Text formatting">
		<Select
			aria-label="Text style"
			value={selection.heading}
			disabled={disabled || !editor}
			class="w-auto"
			options={[
				{ value: '0', label: 'Paragraph' },
				{ value: '1', label: 'Heading 1' },
				{ value: '2', label: 'Heading 2' },
				{ value: '3', label: 'Heading 3' }
			]}
			onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
				const level = Number(event.currentTarget.value);
				if (level)
					editor
						?.chain()
						.focus()
						.toggleHeading({ level: level as 1 | 2 | 3 })
						.run();
				else editor?.chain().focus().setParagraph().run();
			}}
		/>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Bold"
			title="Bold"
			aria-pressed={selection.bold}
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().toggleBold().run()}><Bold size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Italic"
			title="Italic"
			aria-pressed={selection.italic}
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Underline"
			title="Underline"
			aria-pressed={selection.underline}
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().toggleUnderline().run()}
			><Underline size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Strikethrough"
			title="Strikethrough"
			aria-pressed={selection.strike}
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().toggleStrike().run()}
			><Strikethrough size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Bullet list"
			title="Bullet list"
			aria-pressed={selection.bulletList}
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().toggleBulletList().run()}><List size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Numbered list"
			title="Numbered list"
			aria-pressed={selection.orderedList}
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().toggleOrderedList().run()}
			><ListOrdered size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Align left"
			title="Align left"
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().setTextAlign('left').run()}
			><AlignLeft size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Align center"
			title="Align center"
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().setTextAlign('center').run()}
			><AlignCenter size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Align right"
			title="Align right"
			disabled={disabled || !editor}
			onclick={() => editor?.chain().focus().setTextAlign('right').run()}
			><AlignRight size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Edit link"
			title="Edit link"
			disabled={disabled || !editor}
			onclick={() => open('link')}><Link size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Insert or edit image"
			title="Insert or edit image"
			disabled={disabled || !editor}
			onclick={() => open('image')}><Image size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Insert table"
			title="Insert table"
			disabled={disabled || !editor}
			onclick={() =>
				editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
			><Table size={18} /></Button
		>
		{#if selection.table}<Button
				variants={['ghost']}
				{disabled}
				onclick={() => editor?.chain().focus().addRowAfter().run()}>Add row</Button
			><Button
				variants={['ghost']}
				{disabled}
				onclick={() => editor?.chain().focus().addColumnAfter().run()}>Add column</Button
			><Button
				variants={['ghost']}
				{disabled}
				onclick={() => editor?.chain().focus().deleteTable().run()}>Remove table</Button
			>{/if}
		{#if onInsertComponent}<Button
				variants={['ghost']}
				disabled={disabled || !editor}
				onclick={onInsertComponent}>Questions</Button
			>{/if}
		<Button
			variants={['ghost', 'icon']}
			aria-label="Undo"
			title="Undo"
			disabled={disabled || !selection.undo}
			onclick={() => editor?.chain().focus().undo().run()}><Undo2 size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Redo"
			title="Redo"
			disabled={disabled || !selection.redo}
			onclick={() => editor?.chain().focus().redo().run()}><Redo2 size={18} /></Button
		>
	</Card>
	<Card class="p-4"><Div bind:element class={$theme.RichTextEditor.content} /></Card>
</Div>
{#if dialog}
	<Modal
		bind:isOpen={
			() => !!dialog,
			(open) => {
				if (!open) dialog = null;
			}
		}
		role="dialog"
		aria-label={dialog === 'link' ? 'Edit link' : 'Image settings'}
		class="w-full max-w-lg space-y-4 p-5"
	>
		<Div class="flex items-center justify-between gap-3"
			><H2 class="text-lg">{dialog === 'link' ? 'Edit link' : 'Image settings'}</H2><Button
				variants={['ghost', 'icon']}
				aria-label="Close settings"
				onclick={() => (dialog = null)}><X size={18} /></Button
			></Div
		>
		<Input label={dialog === 'link' ? 'Link URL' : 'Image URL'} aria-label="URL" bind:value={url} />
		{#if dialog === 'image'}<Input label="Alternative text" bind:value={alt} /><Input
				label="Caption"
				bind:value={caption}
			/><Input label="Width (%)" type="number" min={10} max={100} bind:value={width} /><Select
				label="Alignment"
				bind:value={imageAlign}
				options={['left', 'center', 'right'].map((value) => ({ value, label: value }))}
			/>{/if}
		{#if error}<P role="alert">{error}</P>{/if}
		<Div class="flex flex-wrap gap-2"
			><Button onclick={apply}>Apply</Button>{#if dialog === 'link'}<Button
					variants={['ghost']}
					onclick={() => {
						editor?.chain().focus().unsetLink().run();
						dialog = null;
					}}>Remove link</Button
				>{/if}<Button variants={['ghost']} onclick={() => (dialog = null)}>Cancel</Button></Div
		>
	</Modal>
{/if}
