<script lang="ts">
	import type { PgRelationalQuery } from "drizzle-orm/pg-core/query-builders/query";
	import type { PageData } from "./$types";
	import { Input } from "$lib/components";

    type Column = (keyof Row);
    type Props = {
        data: PageData
    }
    type Row = Rows[number];
    type Rows = PageData['streamed']['routes'] extends PgRelationalQuery<infer U> ? U : never;

    let columns: Column[] = $state([]);
    let { data }: Props = $props();
    let rows: Rows = $state([]);
    $effect(() => {
        data.streamed.routes.then(value => {
            if (value.length > 0) columns = <Column[]>Object.keys(value[0]);
            rows = value;
        })
    })
</script>

<table>
    <thead>
        <tr>
            <th><Input type="checkbox" /></th>
            {#each columns as key}
                <th>{key}</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#await data.streamed.routes}
            <tr><td>Loading...</td></tr>
        {:then _}
            {#each rows as row}
                <tr>
                    <td><Input type="checkbox" /></td>
                    {#each columns as key}
                        <td>{row[key] || ''}</td>
                    {/each}
                </tr>
            {/each}
        {/await}
    </tbody>
</table>