<script>
  import { current_component } from 'svelte/internal';
  import { twMerge } from 'tailwind-merge';
  import { getEvents, use as useAction } from '$actions';
  import { Checkbox, Icon, Td } from '$components';
  import { Check } from '$icons';
  import { theme } from '$stores';

  // props (internal)
  const events = getEvents(current_component);

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

<Td>
  <Checkbox
    checked={value}
    class="mx-auto"
    on:click={(e) => {
      value = e.target.checked;
      const fieldCollection = column?.collection === undefined ? collection : column?.collection;
      const query = { _id: row._id };
      const update = { $set: {} };
      update.$set[column.key] = value;
      updateField({ collection: fieldCollection, query, update });
    }}
    on:keydown={(e) => {
      keyDownHandler({ e, i, j });
    }}
  />
</Td>
