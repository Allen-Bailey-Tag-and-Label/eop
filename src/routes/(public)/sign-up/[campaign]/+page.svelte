<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { A, Card, Div, Form, Input, SubmitButton } from '$lib/components';
	import { ABTL, PTI } from '$lib/logos';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		data?: any;
		form?: any;
		params?: {
			campaign: string;
		};
	};

	let { children, data, form, params }: Props = $props();
	let isLoading = $state(false);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
</script>

<Div class="flex min-h-screen flex-col items-center justify-center space-y-6 p-4">
	<Card class="max-w-sm">
		<Div>
			<Div class="flex items-center space-x-2 dark:hidden">
				<ABTL size={128} />
				<Plus size={36} />
				<PTI size={128} />
			</Div>
			<Div class="hidden items-center space-x-2 dark:flex">
				<ABTL color="currentColor" size={128} />
				<Plus size={36} />
				<PTI color="currentColor" size={128} />
			</Div>
		</Div>
		{#if children}
			{@render children()}
		{:else}
			<Form {form} {submitFunction}>
				{#snippet inputs()}
					<Input class="sr-only" name="campaign" type="hidden" value={params?.campaign} />
					<Input autofocus={true} label="First Name" name="firstName" required={true} />
					<Input label="Last Name" name="lastName" required={true} />
				{/snippet}
				{#snippet error()}
					{form?.error}
				{/snippet}
				{#snippet buttons()}
					<SubmitButton bind:isLoading>Sign Up</SubmitButton>
				{/snippet}
			</Form>
		{/if}
	</Card>
</Div>
