<script lang="ts">
	import { QuoteLayout } from '$lib/components';
	import type { ComponentProps } from 'svelte';
	let props: ComponentProps<typeof QuoteLayout> = $props();
</script>

<QuoteLayout {...props} />
