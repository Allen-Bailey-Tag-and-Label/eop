<script lang="ts">
	import { Div, Post } from '$lib/components';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.post.title} - EOP</title>
</svelte:head>

<Div class="mx-auto w-full max-w-4xl">
	<Post
		postId={data.post.id}
		date={new Date(data.post.date)}
		firstName={data.post.firstName}
		lastName={data.post.lastName}
		md={data.post.md}
		content={data.post.content}
		title={data.post.title}
	/>
</Div>
