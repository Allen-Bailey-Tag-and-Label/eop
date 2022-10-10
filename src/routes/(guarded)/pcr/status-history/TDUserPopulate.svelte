<script>
  import { Td } from '$components';
  import { collections, theme } from '$stores';

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
</script>

<Td>
  {$collections.users.find((user) => user._id === value)?.[column?.populateField]}
</Td>
