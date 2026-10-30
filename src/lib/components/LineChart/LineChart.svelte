<script lang="ts" generics="TData = unknown">
	import { LineChart as LayerChart, type LineChartProps } from 'layerchart';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	type Props = Omit<LineChartProps<TData>, 'class' | 'ref' | 'context'> & {
		class?: string;
		element?: HTMLElement;
		context?: LineChartProps<TData>['context'];
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
		$theme.LineChart.default,
		...variants.map((variant) => $theme.LineChart[variant]),
		className
	)}
/>
