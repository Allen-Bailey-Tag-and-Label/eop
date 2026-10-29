<script lang="ts">
	import { Div, Input } from '$lib/components';
	let {
		value,
		label,
		disabled = false,
		element = $bindable(null),
		onValueChange
	}: {
		value: string;
		label: string;
		disabled?: boolean;
		element?: HTMLInputElement | null;
		onValueChange: (value: string) => void;
	} = $props();
	let hexValue = $derived(value.slice(1).toUpperCase());
	function hex(value: string) {
		const cleaned = value.trim().replace(/^#/, '');
		return /^[a-f\d]{6}$/i.test(cleaned) ? `#${cleaned.toLowerCase()}` : null;
	}
</script>

<Div class="flex min-w-0 items-center gap-1">
	<Input
		type="color"
		aria-label={label}
		title={label}
		{value}
		{disabled}
		bind:element
		class="h-8 w-8 shrink-0 rounded-md p-1"
		oninput={(event) => onValueChange(event.currentTarget.value)}
	/>
	<Input
		aria-label={`${label} hex`}
		title="Six-digit hex color"
		bind:value={hexValue}
		{disabled}
		maxlength={7}
		class="h-8 min-w-0 flex-1 rounded-md px-1.5 py-1 font-mono text-[11px]"
		oninput={(event) => {
			const next = hex(event.currentTarget.value);
			if (next) onValueChange(next);
		}}
		onblur={() => {
			hexValue = value.slice(1).toUpperCase();
		}}
	/>
</Div>
