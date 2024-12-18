<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { Button, Div, Icon, Input } from '$lib/components';
	import { Eye, EyeSlash } from 'sveltewind/icons';

	type Props = {
		class?: string;
		name?: string;
		type?: 'password' | 'text';
		value?: string;
		variants?: string[];
	} & Record<string, any>;

	let {
		class: className = undefined,
		name = $bindable(),
		type = $bindable('password'),
		value = $bindable(),
		variants = $bindable(['default']),
		...restProps
	}: Props = $props();
</script>

<Div class="relative">
	<Input {...restProps} bind:value class={twMerge('w-full', className)} {name} {type} {variants} />

	<Button
		class="absolute right-0 top-1/2 -translate-y-1/2"
		onclick={() => {
			type = type === 'password' ? 'text' : 'password';
		}}
		tabindex={-1}
		variants={['default', 'icon', 'ghost']}
	>
		<Icon src={type === 'password' ? Eye : EyeSlash} />
	</Button>
</Div>
