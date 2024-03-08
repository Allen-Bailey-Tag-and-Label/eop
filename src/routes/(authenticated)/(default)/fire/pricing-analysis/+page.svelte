<script lang="ts">
import {
	Button,
	Card,
	Checkbox,
	Fieldset,
	Form,
	Icon,
	Input,
	Modal,
	Select,
	Table,
	Tbody,
	Td,
	Textarea,
	Th,
	Thead,
	Tr
} from '$components';
import * as format from '$lib/format/index';
import { Cog6Tooth } from 'sveltewind/components/icons';
import * as calculate from './calculate';
import { features } from './features';
import { materials } from './materials';
import { routings } from './routings';
import Settings from './Settings.svelte';

// props (internal)
let costIncrease = '5';
let currentPricing: number[] = [];
let featureValues: Map<string, any> = new Map([
	['Additional Colors', 0],
	['Additional Plates', 0],
	['Corner Cutting', false],
	['Inline Eyelets', false],
	['Inline Patching', false],
	['Maximum Colors', 0],
	['Offline Wiring', false]
]);
let margin = '42.75';
let materialItemNumbers: string[] = [];
let preset = 'Custom';
const presetChangeHandler = () => {
	if (preset === 'Tag - Paper - White - No Eyelet & No Wire') {
		featureValues = new Map([
			['Additional Colors', 3],
			['Additional Plates', 3],
			['Corner Cutting', true],
			['Inline Eyelets', false],
			['Inline Patching', true],
			['Maximum Colors', 3],
			['Offline Wiring', false]
		]);
		materialItemNumbers = ['50513150 05.2500', '83000417 00.8750'];
		routingDescriptions = ['Tag Press Passes'];
	}
	if (preset === 'Tag - Paper - White - Eyelet & No Wire') {
		featureValues = new Map([
			['Additional Colors', 3],
			['Additional Plates', 3],
			['Corner Cutting', true],
			['Inline Eyelets', true],
			['Inline Patching', true],
			['Maximum Colors', 3],
			['Offline Wiring', false]
		]);
		materialItemNumbers = ['50513150 05.2500', '83000417 00.8750', '82081168 00.2500'];
		routingDescriptions = ['Tag Press Passes'];
	}
	if (preset === 'Tag - Paper - White - No Eyelet & Wire') {
		featureValues = new Map([
			['Additional Colors', 3],
			['Additional Plates', 3],
			['Corner Cutting', true],
			['Inline Eyelets', false],
			['Inline Patching', true],
			['Maximum Colors', 3],
			['Offline Wiring', true]
		]);
		materialItemNumbers = ['50513150 05.2500', '83000417 00.8750', '87084026 00.0000'];
		routingDescriptions = ['Tag Press Passes', 'Offline Wiring'];
	}
	if (preset === 'Tag - Paper - White - Eyelet & Wire') {
		featureValues = new Map([
			['Additional Colors', 3],
			['Additional Plates', 3],
			['Corner Cutting', true],
			['Inline Eyelets', true],
			['Inline Patching', true],
			['Maximum Colors', 3],
			['Offline Wiring', true]
		]);
		materialItemNumbers = [
			'50513150 05.2500',
			'83000417 00.8750',
			'82081168 00.2500',
			'87084026 00.0000'
		];
		routingDescriptions = ['Tag Press Passes', 'Offline Wiring'];
	}
};
const presetOptions = [
	'Custom',
	'Tag - Paper - White - No Eyelet & No Wire',
	'Tag - Paper - White - Eyelet & No Wire',
	'Tag - Paper - White - No Eyelet & Wire',
	'Tag - Paper - White - Eyelet & Wire'
]
	.sort((a, b) => a.localeCompare(b))
	.map((label) => ({ label, value: label }));
let routingDescriptions: string[] = [];
const modal: {
	[key: string]: {
		clickHandler: () => void;
		close?: () => boolean;
		formValues?: any[];
		isOpen?: boolean;
		open?: () => boolean;
		submitHandler?: (e: CustomEvent<any>) => void;
		toggle?: () => boolean;
	};
} = {
	currentPricing: {
		clickHandler: () => {
			if (modal.currentPricing.open !== undefined) modal.currentPricing.open();
		},
		formValues: [],
		submitHandler: (e: CustomEvent<any>) => {
			e.preventDefault();
			currentPricing = modal.currentPricing.formValues[0]
				.trim()
				.split('\n')
				.map((string) => parseFloat(string.replace(/(\$|\s|\/|\\|M)/g, '')));

			if (modal.currentPricing.close !== undefined) modal.currentPricing.close();
		}
	},
	features: {
		clickHandler: () => {
			modal.features.formValues = Object.keys(features).map((feature) => {
				const featureValue = featureValues.get(feature);
				if (typeof featureValue === 'boolean') return featureValue;
				if (typeof featureValue === 'number') return featureValue.toString();
			});
			if (modal.features.open !== undefined) modal.features.open();
		},
		formValues: [],
		submitHandler: (e: CustomEvent<any>) => {
			e.preventDefault();
			featureValues = new Map(
				Object.keys(features).map((feature, i) => {
					const value = modal.features.formValues[i];
					if (typeof value === 'boolean') return [feature, value];
					if (typeof value === 'string') return [feature, parseInt(value)];
				})
			);
			if (modal.features.close !== undefined) modal.features.close();
		}
	},
	materials: {
		clickHandler: () => {
			modal.materials.formValues = Object.keys(materials).map((materialItemNumber) =>
				materialItemNumbers.includes(materialItemNumber)
			);
			if (modal.materials.open !== undefined) modal.materials.open();
		},
		formValues: [],
		submitHandler: (e: CustomEvent<any>) => {
			e.preventDefault();
			materialItemNumbers = Object.keys(materials).filter(
				(_, i) => modal.materials?.formValues?.[i]
			);
			if (modal.materials.close !== undefined) modal.materials.close();
		}
	},
	routings: {
		clickHandler: () => {
			modal.routings.formValues = Object.keys(routings).map((routingDescription) =>
				routingDescriptions.includes(routingDescription)
			);
			if (modal.routings.open !== undefined) modal.routings.open();
		},
		formValues: [],
		submitHandler: (e: CustomEvent<any>) => {
			e.preventDefault();
			routingDescriptions = Object.keys(routings).filter((_, i) => modal.routings?.formValues?.[i]);
			if (modal.routings.close !== undefined) modal.routings.close();
		}
	},
	settings: {
		clickHandler: () => {
			if (modal.settings.open !== undefined) modal.settings.open();
		}
	}
};
let rows: any[];
let totalRows = '50';

// props (reactive)
$: rows = [...Array(+totalRows)].map((_, i) => {
	const quantity = (i + 1) * 1000;
	const currentCost = calculate.cost(
		quantity,
		materialItemNumbers,
		routingDescriptions,
		featureValues
	);
	const currentSell = (currentPricing[i] * quantity) / 1000 || 0;
	const currentMargin = (currentSell - currentCost) / currentSell;
	const estimatedCost = currentCost * (1 + parseFloat(costIncrease) / 100);
	const totalSell = calculate.price(estimatedCost, parseFloat(margin) / 100);

	return {
		Quantity: format.quantity(quantity),
		'Current Cost': format.currency(currentCost),
		'Current Margin': format.percent(currentMargin),
		'Current Sell': format.currency(currentSell),
		'Current Sell / M': format.perM(currentSell, quantity),
		'New Cost': format.currency(estimatedCost),
		'New Margin': format.percent(parseFloat(margin) / 100),
		'New Sell': format.currency(totalSell),
		'New Sell / M': format.perM(totalSell, quantity),
		'Increase Cost': format.currency(estimatedCost - currentCost),
		'Increase Margin': format.percent(parseFloat(margin) / 100 - currentMargin),
		'Increase Sell': format.currency(totalSell - currentSell),
		'Increase Sell / M': format.perM(totalSell - currentSell, quantity),
		'Increase Cost %': format.percent(estimatedCost / currentCost - 1),
		'Increase Margin %': format.percent(parseFloat(margin) / 100 / currentMargin - 1),
		'Increase Sell %': format.percent(totalSell / currentSell - 1)
	};
});
</script>

<div class="flex max-h-full max-w-full flex-col items-start space-y-6 overflow-visible">
	<div>
		<Button class="lg:hidden" on:click={modal.settings.clickHandler} variants={['icon']}>
			<Icon src={Cog6Tooth} />
		</Button>
		<div class="hidden items-end space-x-6 lg:flex">
			<Settings
				bind:costIncrease={costIncrease}
				bind:featureValues={featureValues}
				bind:materialItemNumbers={materialItemNumbers}
				bind:margin={margin}
				bind:preset={preset}
				bind:routingDescriptions={routingDescriptions}
				bind:totalRows={totalRows}
				modal={modal}
				presetOptions={presetOptions}
			/>
		</div>
	</div>
	<Card class="max-w-full overflow-auto p-0">
		<Table>
			<Thead>
				{#each Object.keys(rows[0]) as columnKey}
					<Th>{columnKey}</Th>
				{/each}
			</Thead>
			<Tbody>
				{#each rows as row}
					<Tr>
						{#each Object.keys(row) as columnKey}
							<Td class="text-right">{row[columnKey]}</Td>
						{/each}
					</Tr>
				{/each}
			</Tbody>
		</Table>
	</Card>
</div>

<Modal
	bind:close={modal.settings.close}
	bind:isOpen={modal.settings.isOpen}
	bind:open={modal.settings.open}
	bind:toggle={modal.settings.toggle}
>
	<div class="flex flex-col space-y-6 pt-8">
		<Settings
			bind:costIncrease={costIncrease}
			bind:featureValues={featureValues}
			bind:materialItemNumbers={materialItemNumbers}
			bind:margin={margin}
			bind:preset={preset}
			bind:routingDescriptions={routingDescriptions}
			bind:totalRows={totalRows}
			modal={modal}
			presetOptions={presetOptions}
		/>
	</div>
</Modal>

<Modal
	bind:close={modal.currentPricing.close}
	bind:isOpen={modal.currentPricing.isOpen}
	bind:open={modal.currentPricing.open}
	bind:toggle={modal.currentPricing.toggle}
	class="overflow-auto"
>
	<Form class="pt-8" on:submit={modal.currentPricing.submitHandler}>
		<Textarea bind:value={modal.currentPricing.formValues[0]} />
		<div class="grid grid-cols-2 gap-2">
			<Button on:click={modal.currentPricing.close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</Form>
</Modal>

<Modal
	bind:close={modal.features.close}
	bind:isOpen={modal.features.isOpen}
	bind:open={modal.features.open}
	bind:toggle={modal.features.toggle}
	class="overflow-auto"
>
	<Form class="pt-8" on:submit={modal.features.submitHandler}>
		<div class="grid grid-cols-[fit-content(0)_1fr] items-center gap-x-4 gap-y-2">
			{#each Object.keys(features) as featureDescription, i}
				{@const featureValue = modal.features.formValues[i]}
				<div class="whitespace-nowrap">{featureDescription}</div>
				{#if typeof featureValue === 'boolean'}
					<Checkbox bind:checked={modal.features.formValues[i]} />
				{/if}
				{#if typeof featureValue === 'string'}
					<Input bind:value={modal.features.formValues[i]} class="w-[5rem]" min="0" type="number" />
				{/if}
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-2">
			<Button on:click={modal.features.close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</Form>
</Modal>

<Modal
	bind:close={modal.materials.close}
	bind:isOpen={modal.materials.isOpen}
	bind:open={modal.materials.open}
	bind:toggle={modal.materials.toggle}
>
	<Form class="pt-8" on:submit={modal.materials.submitHandler}>
		{#each Object.keys(materials) as materialItemNumber, i}
			<Checkbox bind:checked={modal.materials.formValues[i]}>
				{materialItemNumber}
			</Checkbox>
		{/each}
		<div class="grid grid-cols-2 gap-2">
			<Button on:click={modal.materials.close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</Form>
</Modal>

<Modal
	bind:close={modal.routings.close}
	bind:isOpen={modal.routings.isOpen}
	bind:open={modal.routings.open}
	bind:toggle={modal.routings.toggle}
>
	<Form class="pt-8" on:submit={modal.routings.submitHandler}>
		{#each Object.keys(routings) as routingDescription, i}
			<Checkbox bind:checked={modal.routings.formValues[i]}>
				{routingDescription}
			</Checkbox>
		{/each}
		<div class="grid grid-cols-2 gap-2">
			<Button on:click={modal.routings.close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</Form>
</Modal>
