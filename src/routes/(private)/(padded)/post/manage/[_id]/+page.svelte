<script lang="ts">
	import PostEditor from '$lib/posts/PostEditor.svelte';
	let { data, form } = $props();
</script>

<PostEditor {data} {form} />
