<script lang="ts">
	import { theme as themeStore } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import Div from '../Div/Div.svelte';

	type Props = {
		class?: string;
		strokeWidth?: string;
		variants?: string[];
	} & any;

	let {
		class: className,
		strokeWidth = $bindable('3'),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div
	{...restProps}
	class={twMerge(
		$themeStore.Spinner.default,
		...variants.map((variant: string) => $themeStore.Spinner[variant]),
		className
	)}
>
	<svg stroke="currentColor" viewBox="0 0 24 24">
		<g>
			<circle cx="12" cy="12" r="9.5" fill="none" stroke-width={strokeWidth} stroke-linecap="round">
				<animate
					attributeName="stroke-dasharray"
					dur="1.5s"
					calcMode="spline"
					values="0 150;42 150;42 150;42 150"
					keyTimes="0;0.475;0.95;1"
					keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="stroke-dashoffset"
					dur="1.5s"
					calcMode="spline"
					values="0;-16;-59;-59"
					keyTimes="0;0.475;0.95;1"
					keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
					repeatCount="indefinite"
				/>
			</circle>
			<animateTransform
				attributeName="transform"
				type="rotate"
				dur="2s"
				values="0 12 12;360 12 12"
				repeatCount="indefinite"
			/>
		</g>
	</svg>
</Div>
