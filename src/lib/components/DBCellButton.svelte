<script>
  import { Button, Td } from '$components';
  import e from 'cors';
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

<Td class="py-0">
  <Button
    on:click={(e) => {
      column?.clickHandler({ e, row });
    }}
  >
    {column.innerHTML}
  </Button>
</Td>
