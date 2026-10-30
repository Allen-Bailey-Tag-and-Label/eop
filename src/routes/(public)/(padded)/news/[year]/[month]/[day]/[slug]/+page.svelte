<script lang="ts">
	import { Post } from '$lib/components';
	let { data } = $props();
</script>

<Post
	postId={data.post.id}
	date={new Date(data.post.date)}
	firstName={data.post.firstName}
	lastName={data.post.lastName}
	md={data.post.md}
	title={data.post.title}
/>
