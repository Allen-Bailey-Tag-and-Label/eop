# Charts

Charts use LayerChart 2.x and the existing slide data-link system. Existing slides
are unchanged; chart settings are saved with the slide definition and included in
JSON exports and portable slide packages.

## Add a chart to a slide

1. Choose **Add > Chart**. The initial line chart contains editable sample rows.
2. Select the chart and expand **Chart** in its properties. Choose Line, Bar, Area,
   Scatter, Pie, or Arc. All six ready-made LayerChart chart types are available.
3. Set **X / category field** and the numeric field for each series. For example,
   manual rows can be `[{"label":"Mon","value":25},{"label":"Tue","value":40}]`.
   Keep X values categorical, or choose Number or Date for a continuous axis.
4. Set series labels, fixed/light/dark colors, label size, axes, grid, legend,
   points, and stacking as appropriate. Bars support horizontal/vertical layout.
   Pie/arc charts use the first numeric series and a category palette; inner
   radius produces a donut. Categories repeat palette colors when needed.
5. Resize, anchor, rotate, pad, or animate the chart like any other slide element.
   Charts can be placed inside frames and repeater templates. Slide animation
   controls the whole element; internal chart motion is disabled for predictable
   playback.

## Use live data

Select the chart, expand **Data binding source**, and choose a published data link
and named output. The chart consumes every row from that output, rather than the
first record. Configure queries, APIs, filters, and grouping in **Data** as usual.

For the seven-day weather workflow, choose output `forecast`, use `day` as X, and
add numeric series `high` and `low`. Use a separate chart/series for lows if the
last overnight low is unavailable: rows missing any configured numeric series
are omitted and counted on the chart. Blank or invalid values are never converted
to zero. Numeric/date axes are sorted; categorical order follows source order.
Bar data should have one row per category; group repeated categories in the data
link first. Charts support up to 500 rows and 12 series.

An empty or failed data source displays its status, rather than sample values.
Changing chart fields does not change the data link. A chart without its own data
link uses its manually configured rows, including when repeated.

## Reuse charts elsewhere

Import application adapters through `$lib/components`:

```svelte
<script lang="ts">
	import { LineChart } from '$lib/components';
	const data = [
		{ month: 1, sales: 120 },
		{ month: 2, sales: 180 }
	];
</script>

<div class="h-80">
	<LineChart {data} x="month" y="sales" axis grid />
</div>
```

`Chart`, `LineChart`, `BarChart`, `AreaChart`, `ScatterChart`, `PieChart`, and
`ArcChart` preserve LayerChart's generic data props, snippets, native options,
and bindable context. Use `bind:element` for the root reference. Application
`class`, `variants`, and theme defaults follow the Sveltewind adapter pattern.
Charts fill their parent; give it a height, or pass explicit width and height.
The shared `ChartPlot` component also renders a serializable chart configuration.

The slide editor provides six presets. Custom charts throughout the application
are not limited to those presets: compose the shared `Chart` with LayerChart's
primitives and native snippets for radar, box plots, maps, or other visualizations.
Complex chart-specific data/layout stays in the feature using it. Promote a
reusable composition into its own `lib/components/<Name>/<Name>.svelte` adapter.

```svelte
<script lang="ts">
	import { Chart } from '$lib/components';
	import { Spline } from 'layerchart';
	const data = [
		{ month: 1, sales: 120 },
		{ month: 2, sales: 180 }
	];
</script>

<div class="h-80">
	<Chart {data} x="month" y="sales" axis grid>
		<Spline stroke="var(--color-primary-500)" />
	</Chart>
</div>
```

See the [LayerChart documentation](https://www.layerchart.com/) for native options
and compositions. Additional slide presets can be added as validated, serializable
configurations; imports never evaluate JavaScript or compile arbitrary components.
