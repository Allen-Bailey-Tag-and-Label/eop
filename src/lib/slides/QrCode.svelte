<script lang="ts">
	import { toSVG } from '@bwip-js/browser';
	import { Div } from '$lib/components';
	let {
		value,
		foreground = '#000000',
		background = '#ffffff',
		correction = 'M'
	}: {
		value: string;
		foreground?: string;
		background?: string;
		correction?: 'L' | 'M' | 'Q' | 'H';
	} = $props();
	const url = $derived.by(() => {
		try {
			if (!value || new TextEncoder().encode(value).length > 1000) return '';
			const options = {
				bcid: 'qrcode',
				text: value,
				eclevel: correction,
				scale: 4,
				paddingwidth: 4,
				paddingheight: 4,
				barcolor: foreground === 'transparent' ? '00000000' : foreground.replace('#', ''),
				...(background === 'transparent' ? {} : { backgroundcolor: background.replace('#', '') })
			};
			const svg = toSVG(options);
			return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
		} catch {
			return '';
		}
	});
</script>

{#if url}<img src={url} alt="QR code" class="h-full w-full object-contain" />{:else}<Div
		class="flex h-full items-center justify-center text-sm"
		role="status"
	>
		Enter QR content of at most 1,000 bytes.
	</Div>{/if}
