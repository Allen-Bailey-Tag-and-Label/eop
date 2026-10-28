<script lang="ts">
	import PlaylistEditor from '$lib/slides/PlaylistEditor.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

{#key data.playlist.id}<PlaylistEditor {data} {form} />{/key}
