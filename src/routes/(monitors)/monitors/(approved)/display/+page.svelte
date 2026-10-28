<script lang="ts">
	import { onMount } from 'svelte';
	import { Div, H1, P } from '$lib/components';
	import { watchMonitorStatus } from '$lib/monitors/watchStatus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let connected = $state(true);
	onMount(() =>
		watchMonitorStatus(
			(state) => {
				if (state !== 'approved') window.location.replace('/monitors/pair');
			},
			(value) => (connected = value),
			30_000
		)
	);
</script>

<svelte:head
	><title>{data.monitor.location} · EOP Monitor</title><meta
		name="robots"
		content="noindex"
	/></svelte:head
>

<Div class="flex min-h-[80svh] w-full flex-col items-center justify-center gap-8 text-center">
	<P class="text-primary-300 text-2xl">Allen-Bailey Tag &amp; Label</P>
	<H1 class="text-5xl text-white md:text-7xl">{data.monitor.location}</H1>
	<P class="max-w-3xl text-2xl text-gray-300">
		This monitor is connected. Company information will appear here when slides are configured.
	</P>
	<P role="status" class="text-sm text-gray-400">
		{connected ? 'Monitor connected' : 'Connection lost. Retrying automatically…'}
	</P>
</Div>
