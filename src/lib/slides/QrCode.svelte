<script lang="ts">
	import { toSVG } from '@bwip-js/browser';
	import { Div } from '$lib/components';
	import { barcodeSymbologies, type BarcodeSymbology } from './barcodes';
	let {
		value,
		foreground = '#000000',
		background = '#ffffff',
		correction = 'M',
		symbology = 'qrcode'
	}: {
		value: string;
		foreground?: string;
		background?: string;
		correction?: 'L' | 'M' | 'Q' | 'H';
		symbology?: BarcodeSymbology;
	} = $props();
	const url = $derived.by(() => {
		try {
			if (!value || new TextEncoder().encode(value).length > 1000) return '';
			const options = {
				bcid: symbology,
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

{#if url}<img
		src={url}
		alt={symbology === 'qrcode'
			? 'QR code'
			: `${barcodeSymbologies.find((item) => item.value === symbology)?.label ?? symbology} barcode`}
		class="h-full w-full object-contain"
	/>{:else}<Div class="flex h-full items-center justify-center text-sm" role="status">
		Enter valid {symbology} content of at most 1,000 bytes. Check the selected symbology's data requirements.
	</Div>{/if}
