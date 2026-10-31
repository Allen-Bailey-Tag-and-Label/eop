<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { Button, Div, Popover } from '$lib/components';
	import { subtleReveal } from 'sveltewind/transitions';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		label: string;
		icon: Snippet;
		options: { label: string; value: string }[];
		value: string;
		disabled: boolean;
		onSelect: (value: string) => void;
	};
	let { label, icon, options, value, disabled, onSelect }: Props = $props();
	let open = $state(false);
	let panel = $state<HTMLDivElement | null>(null);
	let triggerButton = $state<HTMLButtonElement | null>(null);
	let focusLast = false;
	const items = () => [
		...(panel?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])
	];
	$effect(() => {
		if (open && panel) {
			void tick().then(() => {
				if (!open) return;
				const buttons = items();
				buttons[focusLast ? buttons.length - 1 : 0]?.focus();
				focusLast = false;
			});
		}
	});
	function keydown(event: KeyboardEvent) {
		const buttons = items();
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		let next = index;
		if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
		else if (event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = buttons.length - 1;
		else if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
			triggerButton?.focus();
			return;
		} else if (event.key === 'Tab') {
			open = false;
			return;
		} else return;
		event.preventDefault();
		buttons[next]?.focus();
	}
</script>

<Popover
	bind:isVisible={open}
	bind:element={panel}
	transition={[subtleReveal, {}]}
	class={twMerge($theme.Card.default, 'min-w-44 p-1')}
>
	{#snippet trigger(props)}
		<Button
			{...props}
			type="button"
			bind:element={triggerButton}
			variants={['ghost', 'icon']}
			aria-label={label}
			title={label}
			aria-haspopup="menu"
			{disabled}
			onkeydown={(event) => {
				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
					event.preventDefault();
					focusLast = event.key === 'ArrowUp';
					open = true;
				}
			}}>{@render icon()}</Button
		>
	{/snippet}
	<Div role="menu" aria-label={label} onkeydown={keydown}>
		{#each options as option (option.value)}
			<Button
				role="menuitemradio"
				aria-checked={value === option.value}
				tabindex={-1}
				variants={value === option.value ? ['small'] : ['ghost', 'small']}
				class="w-full justify-start"
				onclick={() => {
					open = false;
					onSelect(option.value);
				}}>{option.label}</Button
			>
		{/each}
	</Div>
</Popover>
