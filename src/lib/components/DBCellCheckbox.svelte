<script>
  import { current_component } from 'svelte/internal';
  import { getEvents, use as useAction } from 'sveltewind/actions';
  import { Checkbox, Td } from '$components';
  // import { mask } from '$lib/mongoTable';

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
  <Checkbox bind:checked={value} class="mx-auto">
    <svelte:fragment slot="input">
      <input
        bind:checked={value}
        class="mongoTableElem peer absolute top-0 left-0 opacity-0 w-0"
        on:change={() => {
          const fieldCollection =
            column?.collection === undefined ? collection : column?.collection;
          const query = { _id: row._id };
          const update = { $set: {} };
          update.$set[column.key] = row[column.key];
          updateField({ collection: fieldCollection, query, update });
        }}
        on:keydown={(e) => {
          keyDownHandler({ e, i, j });
        }}
        type="checkbox"
        use:useAction={[events]}
      />
    </svelte:fragment>
  </Checkbox>
</Td>
