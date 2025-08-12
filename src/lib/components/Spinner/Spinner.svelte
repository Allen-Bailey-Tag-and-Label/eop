<script lang="ts">
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<SVGElement>, 'class'> & {
		class?: string;
		dur?: [string | number | null | undefined, string | number | null | undefined];
		element?: SVGElement | null;
		strokeWidth?: string;
		variants?: string[];
	};

	let {
		class: className,
		dur = $bindable(['1.5s', '2s']),
		element = $bindable(null),
		strokeWidth = $bindable('3'),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<svg
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Spinner.default,
		...variants.map((variant: string) => $theme.Spinner[variant]),
		className
	)}
	stroke="currentColor"
	viewBox="0 0 24 24"
>
	<g>
		<circle cx="12" cy="12" r="9.5" fill="none" stroke-width={strokeWidth} stroke-linecap="round">
			<animate
				attributeName="stroke-dasharray"
				dur={dur[0]}
				calcMode="spline"
				values="0 150;42 150;42 150;42 150"
				keyTimes="0;0.475;0.95;1"
				keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
				repeatCount="indefinite"
			/>
			<animate
				attributeName="stroke-dashoffset"
				dur={dur[0]}
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
			dur={dur[1]}
			values="0 12 12;360 12 12"
			repeatCount="indefinite"
		/>
	</g>
</svg>
