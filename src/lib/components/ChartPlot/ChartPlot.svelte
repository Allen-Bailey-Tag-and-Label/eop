<script lang="ts">
	import { scaleLinear, scalePoint, scaleUtc } from 'd3-scale';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import {
		LineChart,
		BarChart,
		AreaChart,
		ScatterChart,
		PieChart,
		ArcChart,
		Div,
		P
	} from '$lib/components';
	import {
		chartData,
		type ChartDefinition,
		type ChartRow,
		type ChartColor
	} from '../Chart/definition';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		settings: ChartDefinition;
		data?: ChartRow[];
		scheme?: 'light' | 'dark';
		fontScale?: number;
		width?: number;
		height?: number;
		class?: string;
		variants?: string[];
		element?: HTMLDivElement | null;
	};
	let {
		settings,
		data = settings.rows,
		scheme = 'light',
		fontScale = 1,
		width,
		height,
		class: className,
		variants = [],
		element = $bindable(null),
		...restProps
	}: Props = $props();
	const prepared = $derived(chartData(settings, data));
	const resolve = (color: ChartColor) => (typeof color === 'string' ? color : color[scheme]);
	const series = $derived(
		settings.series.map((item, index) => ({
			key: `series-${index}`,
			value: `_chartValue${index}`,
			label: item.label || item.field,
			color: resolve(item.color)
		}))
	);
	const xScale = $derived(
		settings.xType === 'date'
			? scaleUtc()
			: settings.xType === 'number'
				? scaleLinear()
				: scalePoint().padding(0.5)
	);
	const common = $derived({
		data: prepared.data,
		width,
		height: height === undefined ? undefined : Math.max(1, height - (prepared.omitted ? 24 : 0)),
		motion: 'none' as const,
		legend: settings.legend,
		tooltipContext: false,
		highlight: false,
		rule: false
	});
	const cartesian = $derived({
		...common,
		series,
		axis: settings.axis,
		grid: settings.grid,
		points: (settings.kind === 'line' || settings.kind === 'area') && settings.points,
		padding: settings.axis
			? {
					left: settings.fontSize * fontScale * 4,
					right: 20,
					top: 20,
					bottom: settings.fontSize * fontScale * 3
				}
			: 15,
		props: {
			xAxis: { tickLabelProps: { fontSize: settings.fontSize * fontScale, stroke: 'none' } },
			yAxis: { tickLabelProps: { fontSize: settings.fontSize * fontScale, stroke: 'none' } }
		},
		seriesLayout: settings.stacked ? ('stack' as const) : ('auto' as const)
	});
</script>

<Div
	role="group"
	aria-label={`${settings.kind} chart`}
	{...restProps}
	bind:element
	class={twMerge(
		$theme.ChartPlot.default,
		...variants.map((variant) => $theme.ChartPlot[variant]),
		className
	)}
>
	{#if prepared.data.length}
		<Div class="min-h-0 flex-1">
			<svelte:boundary>
				{#if settings.kind === 'line'}<LineChart {...cartesian} x="_chartX" {xScale} />
				{:else if settings.kind === 'area'}<AreaChart {...cartesian} x="_chartX" {xScale} />
				{:else if settings.kind === 'bar'}<BarChart
						{...cartesian}
						orientation={settings.orientation}
						x={settings.orientation === 'horizontal'
							? settings.series.map((_, index) => `_chartValue${index}`)
							: '_chartX'}
						y={settings.orientation === 'horizontal'
							? '_chartX'
							: settings.series.map((_, index) => `_chartValue${index}`)}
					/>
				{:else if settings.kind === 'scatter'}<ScatterChart {...cartesian} x="_chartX" {xScale} />
				{:else if settings.kind === 'pie'}<PieChart
						{...common}
						key="_chartX"
						label="_chartX"
						value="_chartValue0"
						c="_chartX"
						cRange={settings.palette.map(resolve)}
						innerRadius={settings.innerRadius}
					/>
				{:else}<ArcChart
						{...common}
						key="_chartX"
						label="_chartX"
						value="_chartValue0"
						c="_chartX"
						cRange={settings.palette.map(resolve)}
						innerRadius={settings.innerRadius}
					/>{/if}
				{#snippet failed()}<P role="alert">Could not render chart. Check its fields and data.</P
					>{/snippet}
			</svelte:boundary>
		</Div>
	{:else}<P role="status">No valid chart rows. Check the X field and numeric series fields.</P>{/if}
	{#if prepared.omitted}<P class="shrink-0 text-xs opacity-60"
			>{prepared.omitted} rows omitted because chart values are missing or invalid.</P
		>{/if}
</Div>
