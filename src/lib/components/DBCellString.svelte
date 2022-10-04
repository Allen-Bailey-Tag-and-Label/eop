<script>
  import { Td } from '$components';
  import { mask } from '$lib/mongoTable';
  import { theme } from '$stores';

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
  <td
    bind:innerHTML={value}
    class={$theme.td}
    contenteditable="true"
    on:blur={() => {
      const fieldCollection = column?.collection === undefined ? collection : column?.collection;
      const query = { _id: row._id };
      const update = { $set: {} };
      update.$set[column.key] = row[column.key];
      updateField({ collection: fieldCollection, query, update });
    }}
    on:keydown={(e) => {
      keyDownHandler({ e, i, j });
    }}
  />
{:else}
  <Td>{mask?.[column.mask]?.(row[column.key]) || row[column.key]}</Td>
{/if}
