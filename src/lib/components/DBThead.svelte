<script>
  import { Checkbox, Th, Thead } from '$components';

  // handlers
  const checkboxClickHandler = (e) => {
    rows = [...rows].map((row) => {
      row._mongoTable.selected = e.target.checked;
      return row;
    });
  };

  // props (external)
  export let columns = [];
  export let editable = false;
  export let rows = [];
  export let sort;
</script>

<Thead>
  {#if editable}
    <Th class="w-[32px]"><Checkbox on:click={checkboxClickHandler} /></Th>
  {/if}
  {#each [...columns].filter(({ type }) => type !== 'hidden') as column}
    <Th
      class={sort !== false ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
      on:click={() => {
        sort = {
          direction: column.key === sort.key ? sort.direction * -1 : 1,
          key: column.key
        };
      }}>{column.innerHTML}</Th
    >
  {/each}
</Thead>
