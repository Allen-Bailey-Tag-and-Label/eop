<script lang="ts">
	import { onMount } from 'svelte';
	import SlidePlayer from '$lib/slides/SlidePlayer.svelte';
	import { watchMonitorStatus, monitorRefreshUrl } from '$lib/monitors/watchStatus';
	import { MONITOR_STATUS_INTERVAL_MS } from '$lib/monitors/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let player: SlidePlayer | undefined = $state();
	onMount(() =>
		watchMonitorStatus(
			(state) => {
				if (state !== 'approved') window.location.replace('/monitors/pair');
			},
			() => {},
			MONITOR_STATUS_INTERVAL_MS,
			{
				version: data.monitor.refreshVersion ?? 0,
				onRefresh: (version) =>
					window.location.replace(monitorRefreshUrl(window.location.href, version)),
				navigation: {
					monitorId: data.monitor.id,
					onNavigate: (command) => player?.navigate(command) ?? false
				}
			}
		)
	);
</script>

<svelte:head
	><title>{data.monitor.location} · EOP Monitor</title><meta
		name="robots"
		content="noindex"
	/></svelte:head
>

<SlidePlayer bind:this={player} location={data.monitor.location} />
