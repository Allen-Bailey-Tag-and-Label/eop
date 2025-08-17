<script>
	import { Div } from '$lib/components';

	let { children } = $props();
</script>

<Div class="flex flex-col px-4 pt-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
	{@render children()}
</Div>
