<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';
	import ColorSwatch from './ColorSwatch.svelte';
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
		compact = false,
		element = $bindable(null)
	}: {
		label: string;
		ariaLabel?: string;
		value: SlideColor;
		onValueChange: (value: SlideColor) => void;
		scheme: ColorScheme;
		disabled?: boolean;
		compact?: boolean;
		element?: HTMLInputElement | null;
	} = $props();
	let fixedInput = $state<HTMLInputElement | null>(null);
	let lightInput = $state<HTMLInputElement | null>(null);
	let darkInput = $state<HTMLInputElement | null>(null);
	$effect(() => {
		element = typeof value === 'string' ? fixedInput : scheme === 'light' ? lightInput : darkInput;
	});
	function changeMode(event: Event & { currentTarget: HTMLSelectElement }) {
		if (event.currentTarget.value === 'fixed') onValueChange(resolveSlideColor(value, scheme));
		else if (typeof value === 'string') onValueChange({ light: value, dark: value });
	}
</script>

{#if compact}
	<Div class="min-w-0 space-y-1.5">
		<Div class="flex items-center justify-between gap-2"
			><span class="text-xs font-medium">{label}</span><Select
				aria-label={`${ariaLabel} mode`}
				title={`${label} mode`}
				value={typeof value === 'string' ? 'fixed' : 'themed'}
				{disabled}
				options={[
					{ label: 'Fixed', value: 'fixed' },
					{ label: 'Light / Dark', value: 'themed' }
				]}
				class="h-7 w-28 rounded-md px-2 py-1 text-[11px]"
				onchange={changeMode}
			/></Div
		>
		{#if typeof value === 'string'}<ColorSwatch
				label={ariaLabel}
				{value}
				{disabled}
				bind:element={fixedInput}
				{onValueChange}
			/>
		{:else}<Div class="grid grid-cols-2 gap-2">
				<Div class="min-w-0 space-y-1"
					><span class="flex items-center gap-1 text-[10px] opacity-60"><Sun size={11} />Light</span
					><ColorSwatch
						label={`${ariaLabel} in light mode`}
						value={value.light}
						{disabled}
						bind:element={lightInput}
						onValueChange={(color) => {
							if (typeof value !== 'string') onValueChange({ ...value, light: color });
						}}
					/></Div
				>
				<Div class="min-w-0 space-y-1"
					><span class="flex items-center gap-1 text-[10px] opacity-60"><Moon size={11} />Dark</span
					><ColorSwatch
						label={`${ariaLabel} in dark mode`}
						value={value.dark}
						{disabled}
						bind:element={darkInput}
						onValueChange={(color) => {
							if (typeof value !== 'string') onValueChange({ ...value, dark: color });
						}}
					/></Div
				>
			</Div>{/if}
	</Div>
{:else}
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
{/if}
