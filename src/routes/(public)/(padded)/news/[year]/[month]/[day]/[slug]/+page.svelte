<script lang="ts">
	import { Post } from '$lib/components';

	type _CreatedById = {
		_profileId: _ProfileId;
	};
	type _ProfileId = {
		firstName: string;
		lastName: string;
	};
	type Data = {
		_createdById: _CreatedById;
		category: string;
		createdAt: string;
		date: string;
		md: string;
		slug: string;
		tags: string[];
		title: string;
		updatedAt: string;
	};
	type Props = {
		data: Data;
	};
	let { data }: Props = $props();

	const date = $derived.by(() => new Date(data.createdAt));
	const firstName = $derived.by(() => data._createdById._profileId.firstName);
	const lastName = $derived.by(() => data._createdById._profileId.lastName);
	const md = $derived.by(() => data.md);
	const title = $derived.by(() => data.title);
</script>

<Post {date} {firstName} {lastName} {md} {title} />
