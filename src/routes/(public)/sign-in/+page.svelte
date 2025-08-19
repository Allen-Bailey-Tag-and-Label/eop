<script lang="ts">
	import { A, Card, Div, Form, Input, SubmitButton } from '$lib/components';
	import { ABTL, PTI } from '$lib/logos';
	import { Plus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form }: PageProps = $props();
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
	<Card>
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
		<Form {form} {submitFunction}>
			{#snippet inputs()}
				<Input autofocus={true} label="Username" name="username" required={true} />
				<Input label="Password" name="password" required={true} type="password" />
				<A href="forgot-password">Forgot Password</A>
			{/snippet}
			{#snippet error()}
				{form?.error}
			{/snippet}
			{#snippet buttons()}
				<SubmitButton bind:isLoading>Sign In</SubmitButton>
			{/snippet}
		</Form>
	</Card>
</Div>
