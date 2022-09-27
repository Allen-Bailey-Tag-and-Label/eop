<script>
  import { Input, Td } from '$components';
  import { mask } from '$lib/mongoTable';
  import { theme } from '$stores';
  import e from 'cors';

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
  <Td class="p-0">
    <Input
      bind:value
      class="text-right cursor-pointer mongoTableElem rounded-none ring-offset-0 ring-1 focus:ring-primary-500"
      on:blur={(e) => {
        const fieldCollection = column?.collection === undefined ? collection : column?.collection;
        const query = { _id: row._id };
        const update = { $set: {} };
        update.$set[column.key] = value;
        updateField({ collection: fieldCollection, query, update });
      }}
      on:keydown={(e) => {
        keyDownHandler({ e, i, j });
      }}
      type="date"
    />
  </Td>
{:else}
  <Td>{mask[column.mask](row[column.key])}</Td>
{/if}
