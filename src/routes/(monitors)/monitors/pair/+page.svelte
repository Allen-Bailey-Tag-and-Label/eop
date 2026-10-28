<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, Div, H1, P } from '$lib/components';
	import { watchMonitorStatus } from '$lib/monitors/watchStatus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let connected = $state(true);
	onMount(() =>
		watchMonitorStatus(
			(state) => {
				if (state === 'approved') window.location.replace('/monitors/display');
				if (state === 'unpaired') window.location.replace('/monitors/pair');
			},
			(value) => (connected = value),
			5000
		)
	);
</script>

<svelte:head
	><title>Connect monitor · EOP</title><meta name="robots" content="noindex" /></svelte:head
>

<Card class="w-full max-w-5xl space-y-8 bg-gray-900 p-10 text-center text-white dark:bg-gray-900">
	<P class="text-primary-300 text-xl font-semibold">Allen-Bailey Tag &amp; Label</P>
	<H1 class="text-4xl text-white">Connect this monitor</H1>
	<P class="text-xl text-gray-200">
		On another computer, sign in to EOP and open Admin → Monitors → Approval. Enter this code and
		describe where this monitor is located.
	</P>
	<Div
		class="rounded-xl bg-gray-950 p-8 font-mono text-6xl font-bold tracking-widest md:text-8xl"
		aria-label="Pairing code"
	>
		{data.code}
	</Div>
	<P class="text-primary-300 text-xl break-words">{data.approvalUrl}</P>
	<P class="text-gray-300">Keep this screen open. It will continue automatically after approval.</P>
	<P class="text-sm text-gray-400"
		>Codes expire after 10 minutes. A new code appears automatically.</P
	>
	<P role="status" class="text-sm text-gray-300">
		{connected ? 'Waiting for approval…' : 'Connection lost. Retrying automatically…'}
	</P>
</Card>
