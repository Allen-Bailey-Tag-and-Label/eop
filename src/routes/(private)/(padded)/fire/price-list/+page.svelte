<script lang="ts">
	import {
		Button,
		Checkbox,
		Datatable,
		Div,
		Form,
		Input,
		Select,
		SubmitButton
	} from '$lib/components';
	import { tagColors } from './tagColors';

	type ProductType = '' | 'collar' | 'fastener' | 'label' | 'tag';

	type Collar = { type: 'collar'; options: { color: string; size: string } };
	type Fastener = { type: 'fastener'; options: { item: string } };
	type Label = { type: 'label'; options: { size: string } };
	type Tag = {
		type: 'tag';
		options: { color: string; material: string; isEyeletted: boolean; isWired: boolean };
	};
	type Empty = { type: ''; options: {} };

	type Product = Collar | Fastener | Label | Tag | Empty;

	let columns = $state([{ key: 'Quantity' }, { key: 'Cost' }]);
	let isLoading = $state(false);
	const product: Product = $state<Product>({
		options: {},
		type: ''
	});
	let rows = $state([]);
	const tagMaterialOptions = [
		{ label: '', value: '' },
		{ label: 'Paper', value: 'paper' },
		{ label: 'Polyart', value: 'polyart' },
		{ label: 'Tyvek', value: 'tyvek' }
	];
	const typeChangeHandler = () => {
		if (product.type === 'collar') product.options = { color: '', size: '' };
		if (product.type === 'fastener') product.options = { item: '' };
		if (product.type === 'label') product.options = { size: '' };
		if (product.type === 'tag')
			product.options = { color: '', material: '', isEyeletted: false, isWired: false };
	};
	const typeOptions: Array<{ label: string; value: ProductType }> = [
		{ label: '', value: '' },
		{ label: 'Collar', value: 'collar' },
		{ label: 'Fastener', value: 'fastener' },
		{ label: 'Label', value: 'label' },
		{ label: 'Tag', value: 'tag' }
	];

	const tagColorOptions = $derived.by(() => {
		let options = [{ label: '', value: '' }];
		if (product.type !== 'tag') return options;
		if (product.options.material === 'paper')
			return [
				...options,
				...tagColors.map((label) => ({
					label,
					value: label
						.toLowerCase()
						.replace(/[^\w|\s]/g, '')
						.replace(' ', '-')
				}))
			];
		if (product.options.material === 'polyart')
			return [
				...options,
				...tagColors
					.filter((label) => ['White'].includes(label))
					.map((label) => ({
						label,
						value: label
							.toLowerCase()
							.replace(/[^\w|\s]/g, '')
							.replace(' ', '-')
					}))
			];
		if (product.options.material === 'tyvek')
			return [
				...options,
				...tagColors
					.filter((label) =>
						['Blue (Dark)', 'Green (Dark)', 'Red', 'White', 'Yellow'].includes(label)
					)
					.map((label) => ({
						label,
						value: label
							.toLowerCase()
							.replace(/[^\w|\s]/g, '')
							.replace(' ', '-')
					}))
			];
		return options;
	});
	const tagMaterialChangeHandler = () => {
		if (product.type !== 'tag') return;
		product.options.color = '';
	};

	$effect(() => {
		if (product.type !== 'tag') return;
		const productType = product.type;
		const color = product?.options?.color;
		const material = product?.options?.material;
		const isEyeletted = product?.options?.isEyeletted;
		if (product.options.material === 'tyvek') product.options.isEyeletted = true;
	});
</script>

<Div class="flex flex-col items-start space-y-6">
	<Div
		class="flex w-auto max-w-none shrink flex-row items-end justify-start space-y-0 space-x-2 self-start"
	>
		<Select
			bind:value={product.type}
			label="Type"
			onchange={typeChangeHandler}
			options={typeOptions}
			required={true}
		/>
		<Input
			class="sr-only absolute h-0 w-0 opacity-0"
			name="product"
			type="hidden"
			value={JSON.stringify(product)}
		/>
		{@render typeTag()}
		<Button class="shrink-0">Update</Button>
	</Div>
	<Datatable bind:columns bind:rows />
</Div>

{#snippet typeTag()}
	{#if product.type === 'tag'}
		<Select
			bind:value={product.options.material}
			label="Material"
			onchange={tagMaterialChangeHandler}
			options={tagMaterialOptions}
			required={true}
		/>
		<Select
			bind:value={product.options.color}
			label="Color"
			options={tagColorOptions}
			required={true}
		/>
		{#if product.options.isEyeletted !== undefined}
			<Checkbox bind:checked={product.options.isEyeletted} label="Eyeletted" />
		{/if}
		{#if product.options.isWired !== undefined}
			<Checkbox bind:checked={product.options.isWired} label="Wired" />
		{/if}
	{/if}
{/snippet}
