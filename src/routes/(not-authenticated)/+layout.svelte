<script lang="ts">
	import { Card, Div } from '$lib/components';

	let { children } = $props();
</script>

<Div class="flex flex-grow flex-col items-center justify-center overflow-auto p-6">
	<Card class="w-full max-w-[24rem] overflow-auto py-12 ">
		{@render children()}
	</Card>
</Div>
