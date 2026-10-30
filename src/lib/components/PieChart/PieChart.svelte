<script lang="ts" generics="TData = unknown">
	import { PieChart as LayerChart, type PieChartProps } from 'layerchart';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	type Props = Omit<PieChartProps<TData>, 'class' | 'ref' | 'context'> & {
		class?: string;
		element?: HTMLElement;
		context?: PieChartProps<TData>['context'];
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
		$theme.PieChart.default,
		...variants.map((variant) => $theme.PieChart[variant]),
		className
	)}
/>
