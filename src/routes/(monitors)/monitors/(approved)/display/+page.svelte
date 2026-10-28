<script lang="ts">
	import { onMount } from 'svelte';
	import SlidePlayer from '$lib/slides/SlidePlayer.svelte';
	import { watchMonitorStatus } from '$lib/monitors/watchStatus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	onMount(() =>
		watchMonitorStatus(
			(state) => {
				if (state !== 'approved') window.location.replace('/monitors/pair');
			},
			() => {},
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

<SlidePlayer location={data.monitor.location} />
