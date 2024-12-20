<script lang="ts">
	import { Button, Div, Fieldset, Form, H1, Input, P, ProgressIndicator } from '$lib/components';
	import { scale, slide } from 'svelte/transition';
	import type { ActionData } from './$types';
	import { cubicInOut } from 'svelte/easing';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
	let disabled: boolean = $state(false);
	const enhanceHandler = async () => {
		disabled = true;
		return async ({ update }: { update: any }) => {
			disabled = false;
			update();
		};
	};
</script>

<Form class="space-y-8" use={[[enhance, enhanceHandler]]}>
	<Div class="flex flex-col items-center space-y-2">
		<H1>Copy DB 💾</H1>
		<P class="opacity-50">Create records from one DB in another</P>
	</Div>
	<Div class="flex flex-col space-y-4">
		<Fieldset legend="Database From">
			<Input name="databaseFrom" required />
		</Fieldset>
		<Fieldset legend="Database To">
			<Input name="databaseTo" required />
		</Fieldset>
		<Fieldset legend="Model Name">
			<Input name="modelName" required />
		</Fieldset>
	</Div>
	{#if form?.error?.message}
		<Div class="text-red-500" transition={[slide, { axis: 'y', duration: 200 }]}>
			{form.error.message}
		</Div>
	{/if}
	<Button class="relative" {disabled} type="submit">
		{#if disabled}
			<ProgressIndicator
				class="h-6 w-6"
				transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}
			/>
		{:else}
			<Div transition={[scale, { duration: 200, easing: cubicInOut, opacity: 1, start: 0 }]}>
				Copy
			</Div>
		{/if}
	</Button>
</Form>
