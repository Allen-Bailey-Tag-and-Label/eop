<script lang="ts">
	import SlideEditor from '$lib/slides/SlideEditor.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

{#key data.slide.id}<SlideEditor {data} {form} />{/key}
