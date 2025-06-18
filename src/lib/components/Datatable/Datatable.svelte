<script lang="ts">
    import type { Snippet } from 'svelte';
	import Table from '../Table/Table.svelte';
	import Thead from '../Thead/Thead.svelte';
	import Tr from '../Tr/Tr.svelte';
	import Th from '../Th/Th.svelte';
	import Input from '../Input/Input.svelte';
	import Tbody from '../Tbody/Tbody.svelte';
	import Td from '../Td/Td.svelte';

    type Column = string;
    type Props = { children?: Snippet; class?: string, columns:Column[]; rows: Row[]; style?: string };
    type Row = Record<string, any>;

    let { children, class: className, columns = $bindable(), rows = $bindable(), style, ...restProps }: Props = $props();
</script>

<Table>
    <Thead>
        <Tr>
            <Th><Input type="checkbox" /></Th>
            {#each columns as key}
                <Th>{key}</Th>
            {/each}
        </Tr>
    </Thead>
    <Tbody>
            {#each rows as row}
                <Tr>
                    <Td><Input type="checkbox" /></Td>
                    {#each columns as key}
                        <Td>{row[key] || ''}</Td>
                    {/each}
                </Tr>
            {/each}
    </Tbody>
</Table>