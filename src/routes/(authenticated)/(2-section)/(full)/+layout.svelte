<script lang="ts">
	import { Div } from '$lib/components';

	let { children } = $props();
</script>

<Div class="m-auto flex w-full flex-col overflow-visible">
	{@render children()}
</Div>
