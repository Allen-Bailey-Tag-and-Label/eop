<script>
  import { Checkbox, Td } from '$components';
  // import { mask } from '$lib/mongoTable';

  // props (external)
  export let collection = '';
  export let column = {};
  // export let columns = [];
  export let editable = true;
  export let i = 0;
  export const j = 0;
  export let keyDownHandler;
  export let row = {};
  // export let rows = [];
  export let updateField;
  export let value = '';
</script>

<Td>
  <Checkbox
    bind:checked={value}
    class="mx-auto"
    on:change={() => {
      const fieldCollection = column?.collection === undefined ? collection : column?.collection;
      const query = { _id: row._id };
      const update = { $set: {} };
      update.$set[column.key] = row[column.key];
      updateField({ collection: fieldCollection, query, update });
    }}
  />
</Td>
