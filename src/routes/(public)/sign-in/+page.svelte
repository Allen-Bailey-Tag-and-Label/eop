<script lang="ts">
	import { Button, Card, Div, Form, Input } from '$lib/components';
	import { ABTL, PTI } from '$lib/logos';
	import { Plus } from '@lucide/svelte';
	import { type PageProps } from './$types';

	let { form }: PageProps = $props();
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
		<Form {form}>
			{#snippet inputs()}
				<Input autoFocus={true} label="Username" name="username" required={true} />
				<Input
					isPasswordButtonVisible={true}
					label="Password"
					name="password"
					required={true}
					type="password"
				/>
			{/snippet}
			<!-- {#if form?.error} -->
			{#snippet error()}
				{form?.error}
			{/snippet}
			<!-- {/if} -->
			{#snippet buttons()}
				<Button type="submit">Sign In</Button>
			{/snippet}
		</Form>
	</Card>
</Div>
