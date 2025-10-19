<script lang="ts">
	import Layout from '../../(private)/(padded)/+layout.svelte';

	let { children } = $props();
</script>

<Layout>
	{@render children()}
</Layout>
