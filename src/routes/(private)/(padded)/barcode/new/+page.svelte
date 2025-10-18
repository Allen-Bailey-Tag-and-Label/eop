<script lang="ts">
	import bwipjs from '@bwip-js/browser';
	import { barcodeTypeOptions } from '$lib/bwipjs';
	import {
		Card,
		Checkbox,
		Div,
		Form,
		Input,
		Label,
		Select,
		SubmitButton,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import RangeInput from '$lib/components/RangeInput/RangeInput.svelte';
	import { currency } from '$lib/formats';
	import type { SubmitFunction } from '@sveltejs/kit';

	let barcodeUnitCost = $state(0.005);
	let bcid = $state('code39');
	let from = $state(30000);
	let height = $state(0.625);
	let includetext = $state(true);
	let isLoading = $state(false);
	let maxLength = $state(4);
	let previewNumber = $state(from);
	let setupUnitCost = $state(35);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			await update();
			isLoading = false;
		};
	};
	let to = $state(44999);
	let width = $state(1.5);

	// $derives
	const alttext = $derived.by(() => previewNumber.toString().padStart(maxLength, '0'));
	const previewMax = $derived.by(() => to - from);
	const barcodeExtendedCost = $derived.by(() => barcodeUnitCost * (previewMax + 1));
	const setupExtendedCost = $derived.by(() => setupUnitCost * 1);
	const totalExtendedCost = $derived.by(() => setupExtendedCost + barcodeExtendedCost);
	const barcodeSVG = $derived.by(() => {
		return bwipjs.toSVG({
			alttext: includetext ? alttext : '',
			bcid,
			height: height * 25.4,
			includetext,
			scale: 1,
			text: alttext,
			textxalign: 'center',
			width: width * 25.4
		});
	});

	// $effects
	$effect(() => {
		if (previewNumber < from) previewNumber = from;
		if (previewNumber > to) previewNumber = to;
	});
</script>

<Form class="max-w-auto flex items-start space-x-4" {submitFunction}>
	<Card>
		<Label>Preview</Label>
		<Div class="bg-white">
			{@html barcodeSVG}
		</Div>
		<RangeInput
			bind:value={
				() => previewNumber.toString(),
				(string) => {
					previewNumber = parseInt(string);
				}
			}
			class="mt-4"
			formatValue={(v: string) => (parseInt(v) + from).toString()}
			isValueVisible={false}
			max={to}
			min={from}
		/>
		<Input
			bind:value={
				() => previewNumber.toString(),
				(string) => {
					previewNumber = parseInt(string);
				}
			}
			class="text-center"
			max={to}
			min={from}
		/>
	</Card>
	<Card class="space-y-4">
		<Div class="flex space-x-2">
			<Input
				bind:value={
					() => {
						return from.toString();
					},
					(string) => {
						from = parseInt(string);
					}
				}
				class="text-right"
				label="From"
				name="from"
				required={true}
				type="number"
			/>
			<Input
				bind:value={
					() => {
						return to.toString();
					},
					(string) => {
						to = parseInt(string);
					}
				}
				class="text-right"
				label="To"
				name="to"
				required={true}
				type="number"
			/>
		</Div>
		<Div class="flex space-x-2">
			<Input
				bind:value={
					() => width.toString(),
					(string) => {
						width = parseFloat(string);
					}
				}
				class="text-right"
				label="Width"
				name="width"
				step={0.0001}
				type="number"
			/>
			<Input
				bind:value={
					() => height.toString(),
					(string) => {
						height = parseFloat(string);
					}
				}
				class="text-right"
				label="Height"
				required={true}
				name="height"
				step={0.0001}
				type="number"
			/>
		</Div>
		<Select
			bind:value={bcid}
			label="Type"
			name="bcid"
			options={barcodeTypeOptions}
			required={true}
		/>
		<Input
			bind:value={
				() => maxLength.toString(),
				(string) => {
					maxLength = parseInt(string);
				}
			}
			class="text-right"
			label="Number of Digits"
			name="maxLength"
			required={true}
			type="number"
		/>
		<Checkbox bind:checked={includetext} label="Include Text" name="includetext" />
	</Card>
	<Card class="flex flex-col items-end space-y-4">
		<Table>
			<Thead>
				<Tr>
					<Th>Description</Th>
					<Th>Quantity</Th>
					<Th>Unit Cost</Th>
					<Th>Extended Cost</Th>
				</Tr>
			</Thead>
			<Tbody>
				<Tr>
					<Td>Setup</Td>
					<Td class="text-right">1</Td>
					<Td class="text-right">{currency(setupUnitCost, { minimumFractionDigits: 4 })}</Td>
					<Td class="text-right">{currency(setupExtendedCost)}</Td>
				</Tr>
				<Tr>
					<Td>Barcode</Td>
					<Td class="text-right">{previewMax + 1}</Td>
					<Td class="text-right">{currency(barcodeUnitCost, { minimumFractionDigits: 4 })}</Td>
					<Td class="text-right">{currency(barcodeExtendedCost)}</Td>
				</Tr>
			</Tbody>
			<Thead>
				<Tr>
					<Th class="text-left" colspan={3}>Total</Th>
					<Th class="text-right">{currency(totalExtendedCost)}</Th>
				</Tr>
			</Thead>
		</Table>
		<SubmitButton bind:isLoading>Place Order</SubmitButton>
	</Card>
	<Input
		class="sr-only absolute top-0 left-0"
		name="barcodeExtendedCost"
		value={barcodeExtendedCost.toString()}
	/>
	<Input
		class="sr-only absolute top-0 left-0"
		name="barcodeUnitCost"
		value={barcodeUnitCost.toString()}
	/>
	<Input
		class="sr-only absolute top-0 left-0"
		name="setupExtendedCost"
		value={setupExtendedCost.toString()}
	/>
	<Input
		class="sr-only absolute top-0 left-0"
		name="setupUnitCost"
		value={setupUnitCost.toString()}
	/>
	<Input
		class="sr-only absolute top-0 left-0"
		name="totalExtendedCost"
		value={totalExtendedCost.toString()}
	/>
</Form>
