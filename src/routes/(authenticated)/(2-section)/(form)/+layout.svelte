<script lang="ts">
	import { Div } from '$lib/components';

	let { children } = $props();
</script>

<Div class="m-auto flex w-full max-w-[20rem] flex-col overflow-visible">
	{@render children()}
</Div>
