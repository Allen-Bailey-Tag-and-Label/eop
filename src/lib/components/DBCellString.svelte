<script>
  import { Td } from '$components';
  import { mask } from '$lib/mongoTable';
  import { theme } from '$stores';

  // props (internal)
  let innerHTML = '';

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

  $: if (column.key || row) {
    innerHTML = column.key.split('.').reduce((o, k) => o[k], row);
  }
</script>

{#if editable}
  <td
    class={$theme.td}
    contenteditable="true"
    on:blur={(e) => {
      value = e.target.innerHTML;
      const fieldCollection = column?.collection === undefined ? collection : column?.collection;
      const query = { _id: row._id };
      const update = { $set: {} };
      update.$set = {};
      update.$set[column.key] = value;
      updateField({ collection: fieldCollection, query, update });
    }}
    on:keydown={(e) => {
      keyDownHandler({ e, i, j });
    }}
  >
    {innerHTML}
  </td>
{:else}
  <Td
    >{mask?.[column.mask]?.(column.key.split('.').reduce((o, k) => o[k], row)) ||
      column.key.split('.').reduce((o, k) => o[k], row)}</Td
  >
{/if}
