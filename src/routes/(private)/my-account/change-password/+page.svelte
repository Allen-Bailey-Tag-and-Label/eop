<script lang="ts">
	import { Button, Div, Form, Input } from '$lib/components';

	let { form } = $props();
</script>

<Div class="flex flex-col p-4">
	<Form>
		{#snippet inputs()}
			<Input label="Password (Current)" name="passwordCurrent" type="password" />
			<Input label="Password (New)" name="password" type="password" />
			<Input label="Password (New Confirm)" name="passwordConfirm" type="password" />
		{/snippet}
		{#snippet error()}
			{form?.error}
		{/snippet}
		{#snippet buttons()}
			<Button type="submit">Change Password</Button>
		{/snippet}
	</Form>
</Div>
