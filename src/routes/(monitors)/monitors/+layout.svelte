<script lang="ts">
	import { Div } from '$lib/components';
	let { children } = $props();
</script>

<Div class="flex min-h-svh w-full items-center justify-center bg-gray-950 p-8 text-white">
	{@render children()}
</Div>
