<script>
	import { Div } from '$lib/components';

	let { children } = $props();
</script>

<Div
	class="flex max-h-full max-w-full flex-grow flex-col overflow-auto px-4 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-4 lg:pt-4 lg:pb-[calc(1rem_+_env(safe-area-inset-bottom))]"
>
	{@render children()}
</Div>
