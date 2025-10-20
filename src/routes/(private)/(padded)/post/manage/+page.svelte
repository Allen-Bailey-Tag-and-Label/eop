<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { A, Div, MongooseTable, Td } from '$lib/components';
	import type { ColumnOverrides, TdSnippet } from '$lib/components/MongooseTable/types.js';
	import { theme } from '$lib/theme';

	let { data } = $props();
	const columnOverrides: ColumnOverrides = $state({
		md: { isHidden: true }
	});
	const virtualColumns = $state([
		{
			key: 'edit',
			label: 'Manage',
			snippet: editSnippet
		}
	]);
</script>

<MongooseTable
	{columnOverrides}
	{data}
	isCreatable={false}
	isEditable={false}
	modelName={'Post'}
	{virtualColumns}
/>

{#snippet editSnippet({ object }: TdSnippet)}
	<Td class="py-0">
		<Div class="flex space-x-2">
			<A
				class={twMerge($theme.Button.default, $theme.Button.small, 'hover:no-underline')}
				href="/post/manage/{object._id}"
			>
				Edit
			</A>
			<A
				class={twMerge($theme.Button.default, $theme.Button.small, 'hover:no-underline')}
				href="/{object.category}/{object.year}/{object.month}/{object.day}/{object.slug}"
				target="_blank"
			>
				View
			</A>
		</Div>
	</Td>
{/snippet}
