<script lang="ts">
	import type { Locals } from '$lib/types';
	import NewRoute from '../../new/+page.svelte';

	type Data = {
		locals: Locals;
		post: Post;
	};

	type Props = {
		data: Data;
	};

	type Post = {
		category: string;
		date: Date;
		md: string;
		slug: string;
		title: string;
	};

	let { data }: Props = $props();
</script>

<NewRoute {data} {...data.post} />
