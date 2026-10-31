<script lang="ts">
	import type { Editor } from '@tiptap/core';
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
		AlignLeft,
		AlignCenter,
		AlignRight,
		AlignJustify,
		Heading,
		Baseline,
		Highlighter,
		CircleHelp
	} from '@lucide/svelte';
	import { Button, DialogActions, DialogHeader, Div, Input, Popover } from '$lib/components';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import { subtleReveal } from 'sveltewind/transitions';
	import { textColor, textSize } from '$lib/rich-text/formatting';
	import ToolbarDropdown from './ToolbarDropdown.svelte';

	type Props = {
		editor: Editor | null;
		revision: number;
		disabled: boolean;
		onLink: () => void;
		onImage: () => void;
		onTable: () => void;
		onQuestions?: () => void;
	};
	let { editor, revision, disabled, onLink, onImage, onTable, onQuestions }: Props = $props();
	let colorOpen = $state<'color' | 'backgroundColor' | null>(null);
	const unavailable = $derived(disabled || !editor);
	const selection = $derived.by(() => {
		void revision;
		const style = editor?.getAttributes('textStyle');
		return {
			bold: editor?.isActive('bold'),
			italic: editor?.isActive('italic'),
			underline: editor?.isActive('underline'),
			strike: editor?.isActive('strike'),
			bulletList: editor?.isActive('bulletList'),
			orderedList: editor?.isActive('orderedList'),
			heading: String(editor?.getAttributes('heading').level ?? 0),
			alignment:
				editor?.getAttributes('heading').textAlign ??
				editor?.getAttributes('paragraph').textAlign ??
				'left',
			fontSize: textSize(style?.fontSize)?.slice(0, -2) ?? '',
			color: textColor(style?.color),
			backgroundColor: textColor(style?.backgroundColor),
			undo: editor?.can().undo() ?? false,
			redo: editor?.can().redo() ?? false,
			table: editor?.isActive('table') ?? false
		};
	});
	function setSize(value: string) {
		if (!value) editor?.chain().focus().unsetFontSize().run();
		else if (textSize(`${value}px`)) editor?.chain().focus().setFontSize(`${value}px`).run();
	}
	function setColor(kind: 'color' | 'backgroundColor', value?: string) {
		if (kind === 'color') {
			if (value) editor?.chain().focus().setColor(value).run();
			else editor?.chain().focus().unsetColor().run();
		} else {
			if (value) editor?.chain().focus().setBackgroundColor(value).run();
			else editor?.chain().focus().unsetBackgroundColor().run();
		}
		colorOpen = null;
	}
</script>

<Div class={$theme.RichTextEditor.toolbar} role="toolbar" aria-label="Text formatting">
	<Div class={$theme.RichTextEditor.toolbarGroup} role="group" aria-label="History">
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
	</Div>
	<Div class={$theme.RichTextEditor.toolbarGroup} role="group" aria-label="Text style and size">
		<ToolbarDropdown
			label="Text style"
			value={selection.heading}
			disabled={unavailable}
			options={[
				{ value: '0', label: 'Paragraph' },
				{ value: '1', label: 'Heading 1' },
				{ value: '2', label: 'Heading 2' },
				{ value: '3', label: 'Heading 3' }
			]}
			onSelect={(value) => {
				if (value === '0') editor?.chain().focus().setParagraph().run();
				else
					editor
						?.chain()
						.focus()
						.setHeading({ level: Number(value) as 1 | 2 | 3 })
						.run();
			}}
		>
			{#snippet icon()}<Heading size={18} />{/snippet}
		</ToolbarDropdown>
		<Input
			type="number"
			aria-label="Font size (px)"
			title="Font size (px); clear to use the default size"
			min={8}
			max={200}
			step={1}
			placeholder="Auto"
			value={selection.fontSize}
			disabled={unavailable}
			class="w-20 px-2 text-center"
			onchange={(event) => setSize(event.currentTarget.value)}
		/>
	</Div>
	<Div class={$theme.RichTextEditor.toolbarGroup} role="group" aria-label="Text styling">
		<Button
			variants={['ghost', 'icon']}
			aria-label="Bold"
			title="Bold"
			aria-pressed={selection.bold}
			disabled={unavailable}
			onclick={() => editor?.chain().focus().toggleBold().run()}><Bold size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Italic"
			title="Italic"
			aria-pressed={selection.italic}
			disabled={unavailable}
			onclick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Underline"
			title="Underline"
			aria-pressed={selection.underline}
			disabled={unavailable}
			onclick={() => editor?.chain().focus().toggleUnderline().run()}
			><Underline size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Strikethrough"
			title="Strikethrough"
			aria-pressed={selection.strike}
			disabled={unavailable}
			onclick={() => editor?.chain().focus().toggleStrike().run()}
			><Strikethrough size={18} /></Button
		>
		{@render colorControl('color', 'Font color')}
		{@render colorControl('backgroundColor', 'Highlight color')}
	</Div>
	<Div class={$theme.RichTextEditor.toolbarGroup} role="group" aria-label="Text alignment">
		<ToolbarDropdown
			label="Text alignment"
			value={selection.alignment}
			disabled={unavailable}
			options={['left', 'center', 'right', 'justify'].map((value) => ({
				value,
				label: `Align ${value}`
			}))}
			onSelect={(value) => editor?.chain().focus().setTextAlign(value).run()}
		>
			{#snippet icon()}
				{#if selection.alignment === 'center'}<AlignCenter size={18} />
				{:else if selection.alignment === 'right'}<AlignRight size={18} />
				{:else if selection.alignment === 'justify'}<AlignJustify size={18} />
				{:else}<AlignLeft size={18} />{/if}
			{/snippet}
		</ToolbarDropdown>
	</Div>
	<Div class={$theme.RichTextEditor.toolbarGroup} role="group" aria-label="Lists">
		<Button
			variants={['ghost', 'icon']}
			aria-label="Numbered list"
			title="Numbered list"
			aria-pressed={selection.orderedList}
			disabled={unavailable}
			onclick={() => editor?.chain().focus().toggleOrderedList().run()}
			><ListOrdered size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Bullet list"
			title="Bullet list"
			aria-pressed={selection.bulletList}
			disabled={unavailable}
			onclick={() => editor?.chain().focus().toggleBulletList().run()}><List size={18} /></Button
		>
	</Div>
	<Div
		class={$theme.RichTextEditor.toolbarGroup}
		role="group"
		aria-label="Links, images and tables"
	>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Edit link"
			title="Edit link"
			disabled={unavailable}
			onclick={onLink}><Link size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Insert or edit image"
			title="Insert or edit image"
			disabled={unavailable}
			onclick={onImage}><Image size={18} /></Button
		>
		<Button
			variants={['ghost', 'icon']}
			aria-label="Table settings"
			title="Table settings"
			aria-pressed={selection.table}
			disabled={unavailable}
			onclick={onTable}><Table size={18} /></Button
		>
	</Div>
	{#if onQuestions}
		<Div class={$theme.RichTextEditor.toolbarGroup} role="group" aria-label="Questions">
			<Button
				variants={['ghost', 'icon']}
				aria-label="Questions"
				title="Questions"
				disabled={unavailable}
				onclick={onQuestions}><CircleHelp size={18} /></Button
			>
		</Div>
	{/if}
</Div>

{#snippet colorControl(kind: 'color' | 'backgroundColor', label: string)}
	<Popover
		bind:isVisible={() => colorOpen === kind, (open) => (colorOpen = open ? kind : null)}
		transition={[subtleReveal, {}]}
		role="dialog"
		aria-label={label}
		class={twMerge($theme.Card.default, 'w-80 max-w-[calc(100vw-2rem)] space-y-3 p-3')}
	>
		{#snippet trigger(props)}
			<Button
				{...props}
				type="button"
				variants={['ghost', 'icon']}
				aria-label={label}
				title={label}
				disabled={unavailable}
			>
				<span class="flex flex-col items-center gap-0.5">
					{#if kind === 'color'}<Baseline size={18} />{:else}<Highlighter size={18} />{/if}
					<span class="h-1 w-5 rounded-sm bg-current" style:background-color={selection[kind]}
					></span>
				</span>
			</Button>
		{/snippet}
		<DialogHeader
			title={label}
			closeAriaLabel={`Close ${label.toLowerCase()}`}
			onClose={() => (colorOpen = null)}
		/>
		<Input
			type="color"
			{label}
			aria-label={label}
			value={selection[kind]?.slice(0, 7) ?? (kind === 'color' ? '#111827' : '#fef08a')}
			variants={['color']}
			onchange={(event) => setColor(kind, event.currentTarget.value)}
		/>
		<DialogActions onClose={() => (colorOpen = null)} closeLabel="Done">
			<Button variants={['ghost', 'small']} onclick={() => setColor(kind)}>
				{kind === 'color' ? 'Default font color' : 'Remove highlight'}
			</Button>
		</DialogActions>
	</Popover>
{/snippet}
