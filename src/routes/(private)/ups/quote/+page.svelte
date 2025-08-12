<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import states from 'states-us';
	import { untrack } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import zipcodes from 'zipcodes';
	import { Button, Div, Form, H1, H2, Input, Select } from '$lib/components';
	import { camelCase } from '$lib/formats';

	type Input =
		| {
				label: string;
				value: string;
				zipLookup?: true;
		  }
		| {
				label: string;
				type: 'number';
				value: string;
		  }
		| {
				label: string;
				options: Option[];
				value: string;
		  };
	type Option = { label: string; value: string };

	let stateOptions: Option[] = $state([{ label: '', value: '' }]);
	let formData: { className?: string; inputs: Input[]; isOpen: boolean; title: string }[] = $state([
		{
			className: 'hidden lg:flex',
			inputs: [
				{ label: 'Address', value: '3177 Lehigh Street' },
				{ label: 'ZIP', type: 'number', value: '14423', zipLookup: true },
				{ label: 'City', value: 'Caledonia' },
				{ label: 'State', options: [], value: 'NY' }
			],
			isOpen: true,
			title: 'Ship From'
		},
		{
			className: 'flex lg:hidden',
			inputs: [
				{ label: 'Address', value: '3177 Lehigh Street' },
				{ label: 'ZIP', type: 'number', value: '14423', zipLookup: true },
				{ label: 'City', value: 'Caledonia' },
				{ label: 'State', options: [], value: 'NY' }
			],
			isOpen: false,
			title: 'Ship From'
		},
		{
			inputs: [
				{ label: 'Address', value: '' },
				{ label: 'ZIP', type: 'number', value: '', zipLookup: true },
				{ label: 'City', value: '' },
				{ label: 'State', options: [], value: '' }
			],
			isOpen: true,
			title: 'Ship To'
		},
		{
			inputs: [
				{ label: 'Total Packages', type: 'number', value: '1' },
				{ label: 'Total Weight', type: 'number', value: '30' }
			],
			isOpen: true,
			title: 'Package Info'
		}
	]);

	$effect(() => {
		stateOptions = [
			{ label: '', value: '' },
			...states.map((state) => ({
				label: state.abbreviation,
				value: state.abbreviation
			}))
		];
		untrack(() => {
			formData.forEach(({ inputs }, sectionIndex) => {
				inputs.forEach(({ options }, inputIndex) => {
					if (options !== undefined)
						formData[sectionIndex].inputs[inputIndex].options = stateOptions;
				});
			});
		});
	});
</script>

<Div class="flex flex-col space-y-8 p-4">
	<H1>UPS Freight Estimator</H1>
	<Form class="lg:max-w-5xl">
		<Div
			class="flex flex-col divide-y divide-gray-200 lg:grid lg:grid-cols-3 lg:gap-4 lg:divide-y-0 dark:divide-gray-700"
		>
			{#each formData as { className, inputs, isOpen, title }, sectionIndex}
				<Div class={twMerge('flex flex-col space-y-2 py-3', className)}>
					<Button
						class="justify-between px-0 py-0"
						onclick={() => (formData[sectionIndex].isOpen = !formData[sectionIndex].isOpen)}
						tabindex="-1"
						variants={['ghost']}
					>
						<H2>{title}</H2>
						<Div class={twMerge('transition duration-200', isOpen ? undefined : '-rotate-90')}>
							<ChevronDown />
						</Div>
					</Button>
					{#if isOpen}
						{#each inputs as { label, options, type, zipLookup }, inputIndex}
							{@const name = camelCase(title + ' ' + label)}
							{#if options === undefined}
								<Input
									bind:value={formData[sectionIndex].inputs[inputIndex].value}
									class={type === 'number' ? 'text-right' : undefined}
									{label}
									{name}
									onchange={() => {
										if (zipLookup === undefined) return;
										const result = zipcodes.lookup(formData[sectionIndex].inputs[inputIndex].value);
										if (result === undefined) return;
										const { city, state } = result;
										formData[sectionIndex].inputs[2].value = city;
										formData[sectionIndex].inputs[3].value = state;
									}}
									required={true}
									{type}
								/>
							{:else}
								<Select
									bind:value={formData[sectionIndex].inputs[inputIndex].value}
									{label}
									{name}
									{options}
									required={true}
								/>
							{/if}
						{/each}
					{/if}
				</Div>
			{/each}
		</Div>
		<Div class="grid grid-cols-2 gap-4 lg:flex lg:justify-end">
			<Button formaction="?/nonValidated" type="submit" variants={['secondary']}>
				Non-Validated
			</Button>
			<Button formaction="?/validated" type="submit">Validated</Button>
		</Div>
	</Form>
</Div>
