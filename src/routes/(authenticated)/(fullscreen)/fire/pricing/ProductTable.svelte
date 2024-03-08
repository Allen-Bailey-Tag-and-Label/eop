<script lang="ts">
import {
	Button,
	Card,
	Checkbox,
	Icon,
	Input,
	Select,
	Table,
	Tbody,
	Td,
	Th,
	Thead,
	Tooltip,
	Tr
} from '$components';
import { DocumentDuplicate, Trash } from '$icons';
import { products } from './store';

// helpers
const addProduct = () => {
	$products = [
		...$products,
		{
			options: {},
			quantity: '',
			repeatNumber: '',
			orderType: '',
			type: '',
			uom: 'EA'
		}
	];
};
const arrayToOptions = (array: (string | { label: string; value: any })[]) =>
	array
		.sort((a, b) => {
			const aValue = typeof a === 'string' ? a : a.label;
			const bValue = typeof b === 'string' ? b : b.label;
			return aValue.localeCompare(bValue);
		})
		.map((value) => ({
			label: typeof value === 'string' ? value : value.label,
			value: typeof value === 'string' ? value : value.value
		}));
const deleteProduct = (productIndex: number) => {
	$products = $products.filter((_, i) => i !== productIndex);
};
const duplicateProduct = (productIndex: number) => {
	const product = structuredClone($products[productIndex]);
	$products = [...$products, product].sort((a, b) => {
		if (a.orderType === '' && a.quantity === '' && a.repeatNumber === '' && a.type === '') return 1;
		if (b.orderType === '' && b.quantity === '' && b.repeatNumber === '' && b.type === '')
			return -1;
		return 0;
	});
};

// props (internal)
const collarColorOptions = arrayToOptions([
	{ label: '-- Color', value: '' },
	'Blue',
	'Green',
	'Gray'
]);
const collarSizeOptions = [
	{ label: '-- Size', value: '' },
	{ label: 'Small', value: 'Small' },
	{ label: 'Medium', value: 'Medium' },
	{ label: 'Large', value: 'Large' }
];
const labelSizeOptions = arrayToOptions([
	{ label: '-- Size', value: '' },
	'4-7/8" x 2-7/16"',
	'5-1/4" x 2-5/8"',
	'5-1/2" x 3"',
	'2" x 2-7/8"',
	'3-1/2" x 2"'
]);
const productOptions = ['Tag', 'Label', 'Collar']
	.sort((a, b) => a.localeCompare(b))
	.map((label) => ({ label, value: label }));
const orderTypeOptions = arrayToOptions(['', 'New', 'Repeat w/Change', 'Repeat']);
const tagColorOptions = new Map([
	['', arrayToOptions([''])],
	[
		'Paper',
		[
			{ label: '-- Color', value: '' },
			{ value: 'blue (dark)', label: 'Blue (Dark)' },
			{ value: 'blue (light)', label: 'Blue (Light)' },
			{ value: 'brown', label: 'Brown' },
			{ value: 'buff', label: 'Buff' },
			{ value: 'gray', label: 'Gray' },
			{ value: 'green (dark)', label: 'Green (Dark)' },
			{ value: 'green (light)', label: 'Green (Light)' },
			{ value: 'ivory', label: 'Ivory' },
			{ value: 'lilac', label: 'Lilac' },
			{ value: 'manila', label: 'Manila' },
			{ value: 'orange', label: 'Orange' },
			{ value: 'pink', label: 'Pink' },
			{ value: 'red', label: 'Red' },
			{ value: 'salmon', label: 'Salmon' },
			{ value: 'white', label: 'White' },
			{ value: 'yellow', label: 'Yellow' },
			{ value: 'fluorescent green', label: 'Fluorescent Green' },
			{ value: 'fluorescent orange', label: 'Fluorescent Orange' },
			{ value: 'fluorescent pink', label: 'Fluorescent Pink' },
			{ value: 'fluorescent red', label: 'Fluorescent Red' },
			{ value: 'fluorescent yellow', label: 'Fluorescent Yellow' }
		]
	],
	[
		'Polyart',
		arrayToOptions([
			{ label: '-- Color', value: '' },
			{ value: 'white', label: 'White' }
		])
	],
	[
		'Tyvek',
		arrayToOptions([
			{ label: '-- Color', value: '' },
			{ value: 'blue (dark)', label: 'Blue (Dark)' },
			{ value: 'green (dark)', label: 'Green (Dark)' },
			{ value: 'red', label: 'Red' },
			{ value: 'white', label: 'White' },
			{ value: 'yellow', label: 'Yellow' }
		])
	]
]);
const tagMaterialOptions = arrayToOptions([
	{ label: '-- Material', value: '' },
	'Paper',
	'Polyart',
	'Tyvek'
]);
const uomOptions = new Map([
	['', arrayToOptions([''])],
	['Label', arrayToOptions(['EA', 'M', 'RL'])],
	['Tag', arrayToOptions(['BX', 'EA', 'M'])],
	['Collar', arrayToOptions(['EA', 'M', 'RL'])]
]);

// props (reactive)
$: initialProducts = [...$products].filter(
	(product) =>
		product.orderType === '' &&
		product.quantity === '' &&
		product.repeatNumber === '' &&
		product.type === ''
);
$: if (initialProducts.length < 1) {
	addProduct();
}
</script>

<Card class="items-start overflow-auto rounded-none p-0">
	<Table>
		<Thead>
			<Th class="z-auto" />
			<Th class="z-auto">Order Type</Th>
			<Th class="z-auto">Repeat Number</Th>
			<Th class="z-auto">Product</Th>
			<Th class="z-auto">Quantity</Th>
			<Th class="z-auto">UoM</Th>
			<Th class="z-auto">Options</Th>
		</Thead>
		<Tbody>
			{#each $products as { options, quantity, repeatNumber, orderType, type, uom }, productIndex}
				<Tr>
					<Td class="w-0 whitespace-nowrap p-2">
						<div class="flex space-x-2">
							<Tooltip tooltip="Delete">
								<Button
									class="p-2"
									disabled={(orderType === '' &&
									quantity === '' &&
									repeatNumber === '' &&
									type === '') ? 'disabled':undefined}
									on:click={() => deleteProduct(productIndex)}
									variants={['icon', 'delete']}
								>
									<Icon class="h-4 w-4" src={Trash} />
								</Button>
							</Tooltip>
							<Tooltip tooltip="Duplicate">
								<Button
									class="p-2"
									disabled={(orderType === '' &&
									quantity === '' &&
									repeatNumber === '' &&
									type === '') ? 'disabled':undefined}
									on:click={() => duplicateProduct(productIndex)}
									variants={['icon']}
								>
									<Icon class="h-4 w-4" src={DocumentDuplicate} />
								</Button>
							</Tooltip>
						</div>
					</Td>
					<Td class="p-0">
						<div class="flex">
							<Select
								bind:value={orderType}
								class="flex-grow rounded-none"
								options={orderTypeOptions}
							/>
						</div>
					</Td>
					<Td class="p-0">
						{#if orderType !== 'New'}
							<div class="flex">
								<Input bind:value={repeatNumber} class="w-[8rem] flex-grow rounded-none" />
							</div>
						{/if}
					</Td>
					<Td class="p-0">
						<div class="flex">
							<Select
								bind:value={type}
								class="flex-grow rounded-none"
								on:change={() => {
									uom = 'EA'
									if (type === 'Collar') options = {color:'', size:''}
									if (type === 'Label') options = {size:''};
									if (type === 'Tag') options = {material:'', color:'', eyelet:false, wire:false}
								}}
								options={productOptions}
							/>
						</div>
					</Td>
					<Td class="p-0">
						<div class="flex">
							<Input
								bind:value={quantity}
								class="max-w-[8rem] flex-grow rounded-none"
								type="number"
							/>
						</div>
					</Td>
					<Td class="p-0">
						<div class="flex">
							<Select
								bind:value={uom}
								class="flex-grow rounded-none"
								options={uomOptions.get(type)}
							/>
						</div>
					</Td>
					<Td class="p-0">
						<div class="flex items-center">
							{#if type === 'Collar'}
								<Select
									bind:value={options.color}
									class="rounded-none"
									on:change={() => {
										if (options.color === '') options.size = '';
										if (options.color === 'Blue') options.size = 'Large';
										if (options.color === 'Green') options.size = 'Small';
										if (options.color === 'Gray') options.size = 'Medium';
									}}
									options={collarColorOptions}
								/>
								<Select
									bind:value={options.size}
									class="rounded-none"
									on:change={() => {
										if (options.size === '') options.color = '';
										if (options.size === 'Small') options.color = 'Green';
										if (options.size === 'Medium') options.color = 'Gray';
										if (options.size === 'Large') options.color = 'Blue';
									}}
									options={collarSizeOptions}
								/>
							{/if}
							{#if type === 'Label'}
								<Select bind:value={options.size} class="rounded-none" options={labelSizeOptions} />
							{/if}
							{#if type === 'Tag'}
								<Select
									bind:value={options.material}
									class="rounded-none"
									on:change={() => {
										if (options.material === 'Polyart' || options.material === 'Tyvek') options.eyelet = true;
									}}
									options={tagMaterialOptions}
								/>
								<Select
									bind:value={options.color}
									class="flex-grow rounded-none"
									options={tagColorOptions.get(options.material)}
								/>
								<div class="flex items-center space-x-2 px-2">
									<Checkbox
										bind:checked={options.eyelet}
										on:change={() => {
											if (options.material === 'Polyart' || options.material === 'Tyvek') options.eyelet = true;
										}}
									>
										Eyelet
									</Checkbox>
									<Checkbox bind:checked={options.wire}>Wire</Checkbox>
								</div>
							{/if}
						</div>
					</Td>
				</Tr>
			{/each}
		</Tbody>
	</Table>
</Card>
