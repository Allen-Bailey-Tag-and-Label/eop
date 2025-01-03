<script lang="ts">
	import { Div } from 'sveltewind/components';

	let { children } = $props();
</script>

<Div
	class="flex flex-grow flex-col space-y-8 overflow-auto p-4 pwa:pt-[env(safe-area-inset-top)] lg:pwa:pt-[1rem]"
>
	{@render children()}
</Div>
