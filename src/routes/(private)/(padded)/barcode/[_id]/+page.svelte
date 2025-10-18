<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button, Card, Div, Form, Spinner, SubmitButton } from '$lib/components';
	import { scale } from 'svelte/transition';

	type Barcode = {
		barcodeExtendedCost: number;
		barcodeUnitCost: number;
		bcid: string;
		from: number;
		height: number;
		includetext: boolean;
		maxLength: number;
		quoteNumber: number;
		setupExtendedCost: number;
		setupUnitCost: number;
		to: number;
		totalExtendedCost: number;
		width: number;
	};

	let { data } = $props();

	let _id = $state('');
	let barcodeExtendedCost = $state(0);
	let barcodeUnitCost = $state(0.005);
	let bcid = $state('code39');
	let buttonMessage = $state('Get PDF');
	const downloadBlob = (blob: Blob) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'barcode.pdf';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};
	let from = $state(30000);
	let height = $state(0.625);
	let includetext = $state(true);
	const inToPt = (inches: number) => inches * 72;
	let isLoading = $state(false);
	let maxLength = $state(4);
	let quoteNumber: null | number = $state(null);
	let setupExtendedCost = $state(0);
	let setupUnitCost = $state(35);
	const onsubmit = async (e: Event) => {
		e.preventDefault();
		buttonMessage = 'Generating PDFs';
		isLoading = true;
		const endpoint = `/barcode/${_id}`;
		const response = await fetch(endpoint);
	};
	let to = $state(44999);
	let totalExtendedCost = $state(0);
	const updateData = async (promise: Promise<unknown>) => {
		const resolved = <Barcode>await promise;
		barcodeExtendedCost = resolved.barcodeExtendedCost;
		barcodeUnitCost = resolved.barcodeUnitCost;
		bcid = resolved.bcid;
		from = resolved.from;
		height = resolved.height;
		includetext = resolved.includetext;
		maxLength = resolved.maxLength;
		quoteNumber = resolved.quoteNumber;
		setupExtendedCost = resolved.setupExtendedCost;
		setupUnitCost = resolved.setupUnitCost;
		to = resolved.to;
		totalExtendedCost = resolved.totalExtendedCost;
		width = resolved.width;
	};
	let width = $state(1.5);

	$effect(() => {
		_id = data._id;
		updateData(data.barcode);
	});
</script>

<Div class="flex flex-col items-start">
	<Form class="max-w-auto flex w-auto flex-col" method="GET" {onsubmit}>
		<Card>
			{#if !quoteNumber}
				Loading...
			{:else}
				<Button type="submit">
					<Div class="flex items-center space-x-2">
						<Div>{buttonMessage}</Div>
						{#if isLoading}
							<div transition:scale={{ duration: 200, start: 0 }}>
								<Spinner />
							</div>
						{/if}
					</Div>
				</Button>
			{/if}
		</Card>
	</Form>
</Div>
