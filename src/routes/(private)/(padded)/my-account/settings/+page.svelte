<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { Form, RangeInput, Select, SubmitButton } from '$lib/components';
	import { percent } from '$lib/formats';

	let { data, form } = $props();
	let isLoading = $state(false);
	let magnification = $state(16);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
	let theme = $state('elegant-midnight');
	const themeOptions = [
		{ label: 'Castlevania Heart', value: 'castlevania-heart' },
		{ label: 'Red Pentacle', value: 'red-pentacle' },
		{ label: 'Cacodemon Red', value: 'cacodemon-red' },
		{ label: 'Scab Red', value: 'scab-red' },
		{ label: 'Bay Brown', value: 'bay-brown' },
		{ label: 'Sugarloaf Brown', value: 'sugarloaf-brown' },
		{ label: 'Duck Hunt', value: 'duck-hunt' },
		{ label: 'Cucumber', value: 'cucumber' },
		{ label: 'Ireland Green', value: 'ireland-green' },
		{ label: 'Barbados Bay', value: 'barbados-bay' },
		{ label: 'Mamala Bay', value: 'mamala-bay' },
		{ label: 'Soulstone Blue', value: 'soulstone-blue' },
		{ label: 'Blue Screen of Death', value: 'blue-screen-of-death' },
		{ label: 'Interdimensional Blue', value: 'interdimensional-blue' },
		{ label: 'Elegant Midnight', value: 'elegant-midnight' },
		{ label: 'Indigo Purple', value: 'indigo-purple' },
		{ label: 'Mardi Gras', value: 'mardi-gras' },
		{ label: 'Strong Cerise', value: 'strong-cerise' }
	];

	$effect(() => {
		if (data.locals.user.settings)
			untrack(() => {
				magnification = data.locals.user.settings.magnification;
				theme = data.locals.user.settings.theme;
			});
	});
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<RangeInput
			bind:value={
				() => {
					return magnification.toString();
				},
				(string) => {
					magnification = +string;
				}
			}
			formatValue={(v: string | number) =>
				percent((typeof v === 'number' ? v : +v) / 16, {
					maximumFractionDigits: 0,
					minimumFractionDigits: 0
				})}
			label="Magnification"
			max={22}
			min={10}
			name="magnification"
		/>
		<Select bind:value={theme} label="Theme" name="theme" options={themeOptions} />
	{/snippet}
	{#snippet error()}
		{form?.error}
	{/snippet}
	{#snippet buttons()}
		<SubmitButton bind:isLoading>Update Settings</SubmitButton>
	{/snippet}
</Form>
