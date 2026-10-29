<script lang="ts">
	import { Div, Input } from '$lib/components';
	import InspectorInput from './InspectorInput.svelte';
	import { colorRgb, colorOpacity, withColorRgb, withColorOpacity } from './colors';
	let {
		value,
		label,
		disabled = false,
		compact = true,
		element = $bindable(null),
		onValueChange
	}: {
		value: string;
		label: string;
		disabled?: boolean;
		compact?: boolean;
		element?: HTMLInputElement | null;
		onValueChange: (value: string) => void;
	} = $props();
	let hexValue = $derived(value === 'transparent' ? '00000000' : value.slice(1).toUpperCase());
	function hex(value: string) {
		const cleaned = value.trim().replace(/^#/, '');
		return /^[a-f\d]{6}([a-f\d]{2})?$/i.test(cleaned) ? `#${cleaned.toLowerCase()}` : null;
	}
	function changeOpacity(event: Event & { currentTarget: HTMLInputElement }) {
		if (event.currentTarget.value === '') return;
		onValueChange(withColorOpacity(value, event.currentTarget.valueAsNumber));
	}
</script>

<Div class="min-w-0 space-y-1">
	<Div class="flex w-full min-w-0 items-center gap-1">
		<Div class={`relative shrink-0 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
			<Input
				type="color"
				aria-label={label}
				title={label}
				value={colorRgb(value)}
				{disabled}
				bind:element
				class="h-full w-full rounded-md p-1 [&::-moz-color-swatch]:opacity-0 [&::-webkit-color-swatch]:opacity-0"
				oninput={(event) => onValueChange(withColorRgb(value, event.currentTarget.value))}
			/>
			<span
				aria-hidden="true"
				class={`color-transparency-swatch pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-gray-800 dark:border-gray-200 ${compact ? 'size-4' : 'size-6'}`}
			>
				<span class="absolute inset-0 rounded-full" style={`background:${value};`}></span>
			</span>
		</Div>
		<Input
			aria-label={`${label} hex`}
			title="Six-digit RGB or eight-digit RGBA hex color"
			bind:value={hexValue}
			{disabled}
			maxlength={9}
			class={`w-0 max-w-full min-w-0 flex-1 rounded-md px-1.5 py-1 font-mono ${compact ? 'h-8 text-[11px]' : 'h-10 text-sm'}`}
			oninput={(event) => {
				const next = hex(event.currentTarget.value);
				if (next) onValueChange(next);
			}}
			onblur={() => {
				hexValue = value === 'transparent' ? '00000000' : value.slice(1).toUpperCase();
			}}
		/>
	</Div>
	{#if compact}
		<InspectorInput
			label={`${label} opacity`}
			prefix="O"
			unit="%"
			type="number"
			min={0}
			max={100}
			step={1}
			value={String(colorOpacity(value))}
			{disabled}
			oninput={changeOpacity}
			onblur={(event) => {
				event.currentTarget.value = String(colorOpacity(value));
			}}
		/>
	{:else}
		<Input
			label="Opacity (%)"
			aria-label={`${label} opacity`}
			type="number"
			min={0}
			max={100}
			step={1}
			value={String(colorOpacity(value))}
			{disabled}
			oninput={changeOpacity}
			onblur={(event) => {
				event.currentTarget.value = String(colorOpacity(value));
			}}
		/>
	{/if}
</Div>

<style>
	.color-transparency-swatch {
		background: repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 0 / 8px 8px;
	}
	:global(.dark) .color-transparency-swatch {
		background-image: repeating-conic-gradient(#374151 0% 25%, #111827 0% 50%);
	}
</style>
