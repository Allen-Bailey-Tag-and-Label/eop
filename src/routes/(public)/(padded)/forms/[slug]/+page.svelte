<script lang="ts">
	import { PublishedForm } from '$lib/components';
	let { data } = $props();
</script>

<PublishedForm slug={data.slug} />
