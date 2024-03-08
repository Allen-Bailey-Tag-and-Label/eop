<script lang="ts">
import { Button, Fieldset, Input, Select } from '$components';

// props (external)
export let costIncrease: string;
export let featureValues: Map<string, any>;
export let materialItemNumbers: string[];
export let margin: string;
export let modal: {
	[key: string]: {
		clickHandler: () => void;
		close?: () => boolean;
		formValues?: any[];
		isOpen?: boolean;
		open?: () => boolean;
		submitHandler?: (e: CustomEvent<any>) => void;
		toggle?: () => boolean;
	};
};
export let preset: string;
export let presetOptions: { label: string; value: string }[];
export let routingDescriptions: string[];
export let totalRows: string;

// props (internal)
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
</script>

<Fieldset legend="Quantities">
	<Input bind:value={totalRows} class="w-[6rem]" min="1" type="number" />
</Fieldset>
<Fieldset legend="Cost Increase %">
	<Input bind:value={costIncrease} class="w-[8rem]" type="number" />
</Fieldset>
<Fieldset legend="Margin %">
	<Input bind:value={margin} class="w-[8rem]" type="number" />
</Fieldset>
<Fieldset legend="Preset">
	<Select bind:value={preset} on:change={presetChangeHandler} options={presetOptions} />
</Fieldset>
<Button on:click={modal.currentPricing.clickHandler}>Load Current Pricing</Button>
<Button on:click={modal.features.clickHandler}>Features</Button>
<Button on:click={modal.materials.clickHandler}>Materials</Button>
<Button on:click={modal.routings.clickHandler}>Routings</Button>
