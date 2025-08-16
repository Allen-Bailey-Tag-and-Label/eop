<script lang="ts">
	import { Card, H2, Table, Tbody } from '$lib/components';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		title: string;
	};

	let { children, title = $bindable('') }: Props = $props();
</script>

<Card class="space-y-6">
	<H2>{title}</H2>
	<Table>
		<Tbody>
			{@render children()}
		</Tbody>
	</Table>
</Card>
