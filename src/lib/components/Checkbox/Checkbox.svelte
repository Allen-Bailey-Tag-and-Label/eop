<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { Check } from '$lib/icons';
	import { attachmentFactory } from '$lib/attachments';

	import Div from '../Div/Div.svelte';
	import Label from '../Label/Label.svelte';
	import Input from '../Input/Input.svelte';

	type Props = {
		attachments?: Attachment[];
		checked?: boolean;
		children?: Snippet;
		class?: string;
		handle?: Snippet;
		style?: string;
	} & any;
	let {
		attachments = $bindable([]),
		checked = $bindable(false),
		children,
		class: className,
		handle,
		style,
		...restProps
	}: Props = $props();
</script>

<Label>
	<Input
		{...restProps}
		{@attach attachmentFactory(attachments)}
		bind:checked
		class="peer sr-only absolute h-0 w-0"
		type="checkbox"
		value={checked.toString()}
	/>
	{#if handle}
		{@render handle()}
	{:else}
		<Div
			class={twMerge(
				'peer-checked:bg-primary-500 peer-checked:hover:outline-primary-500 outline-primary-500/0 peer-focus:outline-primary-500 flex h-6 w-6 items-center justify-center rounded-sm bg-slate-50/30 outline-1 backdrop-blur-md transition duration-200 peer-hover:outline-gray-400 peer-focus:outline-2 dark:bg-slate-50/10',
				className
			)}
			{style}
		>
			<Div class={twMerge('text-white transition duration-200', checked ? 'scale-100' : 'scale-0')}>
				<Check size={16} />
			</Div>
		</Div>
	{/if}
</Label>
