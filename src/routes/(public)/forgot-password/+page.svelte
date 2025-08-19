<script lang="ts">
	import { A, Button, Card, Dialog, Div, Form, Input, P, SubmitButton } from '$lib/components';
	import { ABTL, PTI } from '$lib/logos';
	import { Plus, ThumbsUp } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form }: PageProps = $props();
	let codeVerified = $state(false);
	let isLoading = $state(false);
	let isSuccessDialogOpen = $state(false);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ result, update }) => {
			isLoading = false;
			if (result.type === 'success') {
				if (result?.data?.username) {
					codeVerified = true;
					isSuccessDialogOpen = true;
				} else {
					await update();
				}
			} else {
				await update();
			}
		};
	};
	let username = $state('');
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
		<Form action={!codeVerified ? '?/verify-code' : '?/reset-password'} {form} {submitFunction}>
			{#snippet inputs()}
				{#if !codeVerified}
					<Input
						autofocus={true}
						bind:value={username}
						label="Username"
						name="username"
						required={true}
					/>
					<Input label="Code" name="code" required={true} />
				{:else}
					<Input name="username" value={username} type="hidden" />
					<Input
						autofocus={true}
						label="Password"
						name="password"
						required={true}
						type="password"
					/>
					<Input label="Password Confirm" name="passwordConfirm" required={true} type="password" />
				{/if}
				<A href="sign-in">Sign In</A>
			{/snippet}
			{#snippet error()}
				{form?.error}
			{/snippet}
			{#snippet buttons()}
				{#if !codeVerified}
					<SubmitButton bind:isLoading>Verify Code</SubmitButton>
				{:else}
					<SubmitButton bind:isLoading>Reset Password</SubmitButton>
				{/if}
			{/snippet}
		</Form>
	</Card>
</Div>

<Dialog bind:open={isSuccessDialogOpen}>
	<Card class="items-center space-y-6">
		<Div class="text-green-500 dark:text-green-500">
			<ThumbsUp size={80} />
		</Div>
		<P>Code successful. Please enter your new password.</P>
		<Div class="flex w-full justify-end space-x-2">
			<Button
				onclick={() => {
					isSuccessDialogOpen = false;
				}}
			>
				Close
			</Button>
		</Div>
	</Card>
</Dialog>
