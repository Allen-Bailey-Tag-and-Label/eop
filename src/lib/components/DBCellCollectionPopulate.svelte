<script>
  import { Td } from '$components';
  import { collections } from '$stores';

  // props (internal)

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
  {$collections?.[column?.collection]?.find((doc) => doc._id === row[column.key])?.[
    column?.populateField
  ]}
</Td>
