<script lang="ts">
	import { PrismaTable } from '$lib/components';
	import type { PageData } from './$types';

	type $Props = {
		data: PageData;
	};

	let { data }: $Props = $props();
</script>

<PrismaTable {...data} />
