<script lang="ts" generics="TData = unknown">
	import { Chart as LayerChart, type ChartProps } from 'layerchart';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	type Props = Omit<ChartProps<TData>, 'class' | 'ref' | 'context'> & {
		class?: string;
		element?: HTMLElement;
		context?: ChartProps<TData>['context'];
		variants?: string[];
	};
	let {
		class: className,
		element = $bindable(),
		context = $bindable(),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<LayerChart
	{...restProps}
	bind:ref={element}
	bind:context
	class={twMerge(
		$theme.Chart.default,
		...variants.map((variant) => $theme.Chart[variant]),
		className
	)}
/>
