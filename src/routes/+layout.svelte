<script lang="ts">
	import { Div } from '$lib/components';
	import type { Attachment } from 'svelte/attachments';
	import '../app.css';

	let { children } = $props();
	function animationAttachment(x: 'left' | 'right', y: 'top' | 'bottom'): Attachment<HTMLElement> {
		return (element: HTMLElement) => {
			const angle = Math.random() * 360;
			const distanceModifier = Math.random() * 0.3 - 0.15;
			let request: number;
			const speedModifier = Math.random() * 0.75 + 0.25;
			let start: number;

			const callback = (timestamp: number) => {
				if (start === undefined) start = timestamp;
				const elapsed = (timestamp - start) / 2000;
				const xPos = 0.25 + distanceModifier * Math.cos(angle + speedModifier * elapsed);
				const yPos = 0.25 + distanceModifier * Math.sin(angle + speedModifier * elapsed);
				element.style[x] = `${xPos * 100}%`;
				element.style[y] = `${yPos * 100}%`;

				request = requestAnimationFrame(callback);
			};

			request = requestAnimationFrame(callback);

			return () => {
				cancelAnimationFrame(request);
			};
		};
	}
</script>

{@render children()}

<Div class="pointer-events-none fixed top-0 left-0 -z-10 h-screen w-screen overflow-hidden">
	<Div
		{@attach animationAttachment('left', 'top')}
		class="bg-primary-500/30 absolute aspect-square w-[50vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[10vw] portrait:h-[50vh] portrait:w-auto portrait:blur-[10vh]"
	></Div>
	<Div
		{@attach animationAttachment('right', 'bottom')}
		class="bg-secondary-500/30 absolute aspect-square w-[50vw] translate-x-1/2 translate-y-1/2 rounded-full blur-[10vw] portrait:h-[50vh] portrait:w-auto portrait:blur-[10vh]"
	></Div>
</Div>
