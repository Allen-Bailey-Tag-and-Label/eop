<script lang="ts">
	import { Div, Input, Select } from '$lib/components';
	import { resolveSlideColor } from './colors';
	import type { ColorScheme, SlideColor } from './types';
	let {
		label,
		ariaLabel = label,
		value,
		onValueChange,
		scheme,
		disabled = false,
		element = $bindable(null)
	}: {
		label: string;
		ariaLabel?: string;
		value: SlideColor;
		onValueChange: (value: SlideColor) => void;
		scheme: ColorScheme;
		disabled?: boolean;
		element?: HTMLInputElement | null;
	} = $props();
	let fixedInput = $state<HTMLInputElement | null>(null);
	let lightInput = $state<HTMLInputElement | null>(null);
	let darkInput = $state<HTMLInputElement | null>(null);
	$effect(() => {
		element = typeof value === 'string' ? fixedInput : scheme === 'light' ? lightInput : darkInput;
	});
</script>

<Div class="min-w-0 space-y-2">
	<Select
		label={`${label} mode`}
		aria-label={`${ariaLabel} mode`}
		value={typeof value === 'string' ? 'fixed' : 'themed'}
		{disabled}
		options={[
			{ label: 'Fixed', value: 'fixed' },
			{ label: 'Light / Dark', value: 'themed' }
		]}
		onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
			if (event.currentTarget.value === 'fixed') onValueChange(resolveSlideColor(value, scheme));
			else if (typeof value === 'string') onValueChange({ light: value, dark: value });
		}}
	/>
	{#if typeof value === 'string'}
		<Input
			{label}
			aria-label={ariaLabel}
			type="color"
			{value}
			{disabled}
			bind:element={fixedInput}
			oninput={(event) => onValueChange(event.currentTarget.value)}
		/>
	{:else}
		<Div class="grid grid-cols-2 gap-2">
			<Input
				label="Light"
				aria-label={`${ariaLabel} in light mode`}
				type="color"
				value={value.light}
				{disabled}
				bind:element={lightInput}
				oninput={(event) => {
					if (typeof value !== 'string')
						onValueChange({ ...value, light: event.currentTarget.value });
				}}
			/>
			<Input
				label="Dark"
				aria-label={`${ariaLabel} in dark mode`}
				type="color"
				value={value.dark}
				{disabled}
				bind:element={darkInput}
				oninput={(event) => {
					if (typeof value !== 'string')
						onValueChange({ ...value, dark: event.currentTarget.value });
				}}
			/>
		</Div>
	{/if}
</Div>
