<script lang="ts">
	import { A, Icon, PrismaTable } from '$lib/components';
	import { twMerge } from 'tailwind-merge';
	import type { PageData } from './$types';
	import { theme } from 'sveltewind';
	import { Plus } from 'sveltewind/icons';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<PrismaTable {...data} {CreateToolbar} />

{#snippet CreateToolbar()}
	<A
		class={twMerge(
			theme.getComponentVariant('button', 'default'),
			theme.getComponentVariant('button', 'icon'),
			'hover:text-white hover:shadow-none focus:text-white focus:shadow-none'
		)}
		href="/aes/calculate-margin"
	>
		<Icon src={Plus} />
	</A>
{/snippet}
