<script lang="ts" generics="TData = unknown">
	import { AreaChart as LayerChart, type AreaChartProps } from 'layerchart';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	type Props = Omit<AreaChartProps<TData>, 'class' | 'ref' | 'context'> & {
		class?: string;
		element?: HTMLElement;
		context?: AreaChartProps<TData>['context'];
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
		$theme.AreaChart.default,
		...variants.map((variant) => $theme.AreaChart[variant]),
		className
	)}
/>
