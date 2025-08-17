<script>
	import { Div } from '$lib/components';

	let { children } = $props();
</script>

<Div
	class="flex flex-col px-4 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-4 lg:pt-4 lg:pb-[calc(1rem_+_env(safe-area-inset-bottom))]"
>
	{@render children()}
</Div>
