<script>
  import { Select, Td } from '$components';
  // import { mask } from '$lib/mongoTable';

  // props (external)
  export let collection = '';
  export let column = {};
  // export let columns = [];
  export let editable = true;
  export let i = 0;
  export let j = 0;
  export let keyDownHandler;
  export let row = {};
  // export let rows = [];
  export let updateField;
  export let value = '';
</script>

{#if editable}
  <Td class="p-0 w-[1px]">
    <Select
      bind:value
      class="mongoTableElem bg-transparent hover:bg-transparent focus:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent ring-offset-0 dark:ring-offset-0 rounded-none ring-[1px] focus:ring-primary-500"
      on:change={() => {
        const fieldCollection = column?.collection === undefined ? collection : column?.collection;
        const query = { _id: row._id };
        const update = { $set: {} };
        update.$set[column.key] = row[column.key];
        updateField({ collection: fieldCollection, query, update });
      }}
      on:keydown={(e) => {
        keyDownHandler({ e, i, j, keyCodes: [37, 38, 39, 40] });
      }}
      options={column?.options}
    />
  </Td>
{:else}
  <Td>{value}</Td>
{/if}
