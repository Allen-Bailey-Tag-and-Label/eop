<script lang="ts" generics="TData = unknown">
	import { ScatterChart as LayerChart, type ScatterChartProps } from 'layerchart';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	type Props = Omit<ScatterChartProps<TData>, 'class' | 'ref' | 'context'> & {
		class?: string;
		element?: HTMLElement;
		context?: ScatterChartProps<TData>['context'];
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
		$theme.ScatterChart.default,
		...variants.map((variant) => $theme.ScatterChart[variant]),
		className
	)}
/>
