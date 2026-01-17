<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from '../$types';
	import { browser } from '$app/environment';

	// types
	type Props = {
		children: Snippet;
		data: LayoutData;
	};

	// $props
	let { children, data }: Props = $props();

	// $effects
	$effect(() => {
		if (browser) {
			localStorage.setItem('physicalInventoryBranchId', data.physicalInventoryBranchId.value);
		}
	});
</script>

{#if children}
	{@render children()}
{/if}
