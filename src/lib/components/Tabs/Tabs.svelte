<script lang="ts" generics="T extends string | number">
	import { Tabs as SveltewindTabs } from 'sveltewind/components';
	import type { ComponentProps } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import Button from '../Button/Button.svelte';

	type Props = Omit<ComponentProps<typeof SveltewindTabs>, 'tabs' | 'value'> & {
		tabs?: { title: string; value: T; disabled?: boolean }[];
		value?: T;
		onValueChange?: (value: T) => void;
	};
	let {
		children,
		tabs = [],
		value = $bindable(),
		element = $bindable(null),
		isVisible = $bindable(true),
		onValueChange,
		...restProps
	}: Props = $props();

	function select(next: T) {
		value = next;
		onValueChange?.(next);
	}
	function navigate(event: KeyboardEvent, current: T) {
		const enabled = tabs.filter((tab) => !tab.disabled);
		const index = enabled.findIndex((tab) => tab.value === current);
		const next =
			event.key === 'ArrowRight'
				? (index + 1) % enabled.length
				: event.key === 'ArrowLeft'
					? (index + enabled.length - 1) % enabled.length
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? enabled.length - 1
							: -1;
		if (next < 0 || !enabled[next]) return;
		event.preventDefault();
		select(enabled[next].value);
		element?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')[next]?.focus();
	}
</script>

<SveltewindTabs role="tablist" {...restProps} bind:element bind:isVisible>
	{#if children}
		{@render children()}
	{:else}
		{#each tabs as tab (tab.value)}
			<Button
				role="tab"
				aria-selected={tab.value === value}
				tabindex={tab.value === value ? 0 : -1}
				disabled={tab.disabled}
				variants={tab.value === value ? ['small'] : ['ghost', 'small']}
				class={twMerge($theme.Tabs.button)}
				onclick={() => select(tab.value)}
				onkeydown={(event) => navigate(event, tab.value)}
			>
				{tab.title}
			</Button>
		{/each}
	{/if}
</SveltewindTabs>
