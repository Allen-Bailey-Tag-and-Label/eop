<script>
  import { Td } from '$components';

  // props (external)
  export let collection = '';
  export let column = {};
  export let columns = [];
  export let editable = true;
  export let i = 0;
  export let j = 0;
  export let keyDownHandler;
  export let row = {};
  // export let rows = [];
  // export let updateField;
  // export let value = '';

  $: formula = Function('obj', column.formula);
</script>

<Td>{formula({ collection, column, columns, row })}</Td>
