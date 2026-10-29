<script lang="ts">
	import { Button, Details, Div, P } from '$lib/components';
	import CrossfadeStage from './CrossfadeStage.svelte';
	import { blankSlide, newElement, type PlaylistTransition, type SlideLayer } from './types';
	import { transitionDuration, transitionProgress } from './playlist-transitions';
	let { transition }: { transition: PlaylistTransition } = $props();
	let playing = $state(false);
	let progress = $state(1);
	const sample = (text: string, background: string): SlideLayer => ({
		definition: {
			...blankSlide(),
			width: 640,
			height: 360,
			background,
			elements: [
				{
					...newElement('text', text),
					text,
					x: 40,
					y: 130,
					width: 560,
					height: 100,
					fontSize: 64,
					color: '#ffffff',
					align: 'center'
				}
			]
		},
		data: {},
		assetUrls: {},
		timeMs: 0,
		dataTimeMs: 0
	});
	const outgoing = sample('Slide A', '#1e3a8a');
	const incoming = sample('Slide B', '#166534');
	$effect(() => {
		if (!playing) return;
		const duration = transitionDuration(transition);
		const start = performance.now();
		progress = duration ? 0 : 1;
		let frame: number;
		const tick = (now: number) => {
			progress = transitionProgress(now - start, duration);
			if (progress >= 1) playing = false;
			else frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<Details>
	<summary class="cursor-pointer font-medium">Transition preview</summary>
	<Div class="mt-3 space-y-3">
		<P class="text-sm">Sample slides using the playlist default transition.</P>
		<Div
			class="aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700"
		>
			<CrossfadeStage
				{incoming}
				{outgoing}
				{progress}
				scheme="dark"
				assetBase=""
				label="Sample transition preview"
			/>
		</Div>
		<Button disabled={playing} onclick={() => (playing = true)}>Play transition preview</Button>
	</Div>
</Details>
