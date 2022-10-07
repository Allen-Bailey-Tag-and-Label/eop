<script>
  import { Button, Td } from '$components';
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

<Td class="py-[.25rem]">
  <Button
    class="{$theme.buttonSmall} mx-auto"
    on:click={(e) => {
      column?.clickHandler({ e, row });
    }}
  >
    {column.innerHTML}
  </Button>
</Td>
