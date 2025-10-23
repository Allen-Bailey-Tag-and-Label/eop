<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { Form, RangeInput, Select, SubmitButton } from '$lib/components';
	import { percent } from '$lib/formats';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
		form: any;
	};
	let { data, form }: Props = $props();
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
		'Castlevania Heart',
		'Red Pentacle',
		'Cacodemon Red',
		'Scab Red',
		'Bay Brown',
		'Sugarloaf Brown',
		'Duck Hunt',
		'Cucumber',
		'Ireland Green',
		'Barbados Bay',
		'Mamala Bay',
		'Soulstone Blue',
		'Blue Screen of Death',
		'Interdimensional Blue',
		'Elegant Midnight',
		'Indigo Purple',
		'Mardi Gras',
		'Strong Cerise'
	].map((label) => {
		const value = label.toLowerCase().split(' ').join('-');
		return { label, value };
	});

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
