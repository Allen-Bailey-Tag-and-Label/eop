<script lang="ts">
	import { Input, MongooseTable, Td } from '$lib/components';
	import type { ColumnOverrides, TdSnippet } from '$lib/components/MongooseTable/types';
	import { isoBirthDate } from '$lib/user-profiles/birth-dates';

	let { data } = $props();
	const columnOverrides: ColumnOverrides = {
		birthDate: { label: 'Birth date', snippet: birthDateCell, isCreatable: false }
	};
</script>

<MongooseTable {data} {columnOverrides} modelName="UserProfile" />

{#snippet birthDateCell({ object, key, isEditable }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			<Input
				class="w-full rounded-none bg-transparent shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent"
				type="date"
				aria-label="Birth date"
				value={isoBirthDate(object[key])}
				oninput={(event) =>
					(object[key] = event.currentTarget.value
						? `${event.currentTarget.value}T00:00:00.000Z`
						: null)}
			/>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">{isoBirthDate(object[key]) || '—'}</Td>
	{/if}
{/snippet}
