<script lang="ts">
	import { Button, Div, Form, Input } from '$lib/components';
	import { ABTL, PTI } from '$lib/logos';
	import { Plus } from '@lucide/svelte';
</script>

<Div class="grid grid-cols-1 md:grid-cols-2">
	<Div class="flex min-h-screen flex-col items-center justify-center space-y-6 p-4">
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
		<Form>
			{#snippet inputs()}
				<Input label="Username" name="username" required={true} />
				<Input
					isPasswordButtonVisible={true}
					label="Password"
					name="password"
					required={true}
					type="password"
				/>
			{/snippet}
			{#snippet buttons()}
				<Button type="submit">Sign In</Button>
			{/snippet}
		</Form>
	</Div>
	<Div class="hidden min-h-screen items-center justify-center bg-slate-950/10 p-4 md:flex"></Div>
</Div>
