<script lang="ts">
	import type { PgRelationalQuery } from "drizzle-orm/pg-core/query-builders/query";
	import type { PageData } from "./$types";
	import { Datatable, Div } from "$lib/components";

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
    });
</script>

<Div class="p-6 flex flex-col overflow-auto flex-grow">
    <Datatable bind:columns bind:rows />
</Div>