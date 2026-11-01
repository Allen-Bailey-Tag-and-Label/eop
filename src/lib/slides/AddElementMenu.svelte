<script lang="ts">
	import { tick } from 'svelte';
	import { Plus, ChevronDown } from '@lucide/svelte';
	import { Button, Div, Popover } from '$lib/components';
	import { subtleReveal } from 'sveltewind/transitions';
	import type { ElementType } from './types';
	let {
		tools,
		onAdd
	}: {
		tools: readonly { type: ElementType; label: string; shortcut?: string }[];
		onAdd: (type: ElementType) => void;
	} = $props();
	let open = $state(false);
	let panel = $state<HTMLDivElement | null>(null);
	let triggerButton = $state<HTMLButtonElement | null>(null);
	let focusLast = false;
	let wasOpen = false;
	let restoreFocus = true;
	let search = '';
	let searchTime = 0;
	const items = () =>
		Array.from(panel?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
	$effect(() => {
		if (open && panel) {
			const current = panel;
			void tick().then(() => {
				if (open && panel === current) {
					const buttons = items();
					buttons[focusLast ? buttons.length - 1 : 0]?.focus();
					focusLast = false;
				}
			});
		}
		if (wasOpen && !open && restoreFocus) triggerButton?.focus();
		wasOpen = open;
		restoreFocus = true;
	});
	function keydown(event: KeyboardEvent) {
		const buttons = items();
		if (!buttons.length) return;
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		let next = index;
		if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
		else if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = buttons.length - 1;
		else if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
			return;
		} else if (event.key === 'Tab') {
			restoreFocus = false;
			open = false;
			return;
		} else if (event.key === ' ') {
			event.preventDefault();
			buttons[index]?.click();
			return;
		} else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			search = (Date.now() - searchTime > 500 ? '' : search) + event.key.toLowerCase();
			searchTime = Date.now();
			next = buttons.findIndex(
				(button, i) => i > index && button.textContent?.trim().toLowerCase().startsWith(search)
			);
			if (next < 0)
				next = buttons.findIndex((button) =>
					button.textContent?.trim().toLowerCase().startsWith(search)
				);
			if (next < 0) return;
		} else return;
		event.preventDefault();
		buttons[next]?.focus();
	}
</script>

<!-- DropdownMenu's transition targets its wrapper; Popover exposes the popup transition. -->
<Popover
	bind:isVisible={open}
	bind:element={panel}
	transition={[subtleReveal, {}]}
	class="min-w-48 p-1"
>
	{#snippet trigger(props)}
		<Button
			{...props}
			type="button"
			bind:element={triggerButton}
			aria-label="Add element"
			aria-haspopup="menu"
			class="inline-flex h-9 shrink-0 items-center gap-1 px-2 py-1 text-sm"
			onkeydown={(event) => {
				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
					event.preventDefault();
					focusLast = event.key === 'ArrowUp';
					open = true;
				}
			}}
			><Plus size={18} class="shrink-0" /><span class="hidden md:inline">Add</span><ChevronDown
				size={14}
				class="shrink-0"
			/></Button
		>
	{/snippet}
	<Div role="menu" aria-label="Add element" onkeydown={keydown}>
		{#each tools as tool (tool.type)}
			<Button
				role="menuitem"
				aria-label={tool.label}
				aria-keyshortcuts={tool.shortcut?.replace('Ctrl', 'Control')}
				tabindex={-1}
				variants={['ghost']}
				class="w-full justify-start px-3 py-2 text-sm"
				onclick={() => {
					open = false;
					onAdd(tool.type);
				}}
				>{tool.label}{#if tool.shortcut}<span
						aria-hidden="true"
						class="ml-auto pl-3 text-xs opacity-60">{tool.shortcut}</span
					>{/if}</Button
			>
		{/each}
	</Div>
</Popover>
