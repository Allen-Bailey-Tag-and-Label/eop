<script lang="ts">
	import { Button, Form, Input } from '$lib/components';

	let sourceDB = $state('v4');
	let targetDB = $state('v4Dev');
</script>

<Form>
	{#snippet inputs()}
		<Input bind:value={sourceDB} label="Source DB" name="sourceDB" required={true} />
		<Input bind:value={targetDB} label="Target DB" name="targetDB" required={true} />
	{/snippet}

	{#snippet buttons()}
		<Button type="submit">Duplicate</Button>
	{/snippet}
</Form>
