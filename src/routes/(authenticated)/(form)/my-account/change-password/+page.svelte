<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Button,
		Div,
		Fieldset,
		Form,
		H1,
		P,
		PasswordInput,
		ProgressIndicator
	} from '$lib/components';
	import { cubicInOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import type { ActionData } from './$types';
	import { twMerge } from 'tailwind-merge';

	let disabled: boolean = $state(false);
	const enhanceHandler = async () => {
		disabled = true;
		return async ({ update }: { update: any }) => {
			disabled = false;
			update();
		};
	};
	const inputs = [
		{ legend: 'Current Password', name: 'currentPassword' },
		{ legend: 'New Password', name: 'password' },
		{ legend: 'Retype New Password', name: 'retypePassword' }
	];
	let { form }: { form: ActionData } = $props();
</script>

<Form class="space-y-8" {disabled} use={[[enhance, enhanceHandler]]}>
	<Div class="flex flex-col items-center space-y-2">
		<H1>Change Password 🔒</H1>
		<P class="opacity-50">Enter your credentials below</P>
	</Div>
	<Div class="flex flex-col space-y-4">
		{#each inputs as { legend, name }}
			<Fieldset {legend}>
				<PasswordInput
					class={twMerge('w-full', form?.error?.inputClasses?.[name])}
					{name}
					required={true}
				/>
			</Fieldset>
		{/each}
		{#if form?.error?.message}
			<Div class="text-red-500" transition={[slide, { axis: 'y', duration: 200 }]}>
				{form.error.message}
			</Div>
		{/if}
	</Div>
	<Button class="relative" {disabled} type="submit">
		{#if disabled}
			<ProgressIndicator
				class="h-6 w-6"
				transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}
			/>
		{:else}
			<Div transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}>
				Update Password
			</Div>
		{/if}
	</Button>
</Form>
