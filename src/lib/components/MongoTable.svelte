<script>
  import { browser } from '$app/environment';
  import { Checkbox, Table, Td, Th, Thead, Tr } from '$components';
  import { mask, sanitizeColumns, sanitizeRows } from '$lib/mongoTable';
  import { clientConnection as socketio } from '$lib/socketio';
  import { theme } from '$stores';

  // utilities
  const changeTableFocus = (i, j) => {
    if (browser) {
      const query = `tr:nth-child(${i + 1}) > *:nth-child(${j + 2})${j > -1 ? '' : ' input'}`;
      console.log({ query });
      const newElement = tbodyElem.querySelector(query);
      const length = newElement.innerHTML.replace('<br>', '').length;
      newElement.focus();
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(newElement.childNodes[0], length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (error) {}
    }
  };

  // handlers
  const checkboxClickHandler = (e) => {
    rows = [...rows].map((row) => {
      row._mongoTable.selected = e.target.checked;
      return row;
    });
  };
  const keyDownHandler = ({ e, i, j }) => {
    // check if key should be prevented
    if (
      e.keyCode === 13 ||
      e.keyCode === 37 ||
      e.keyCode === 38 ||
      e.keyCode === 39 ||
      e.keyCode === 40
    ) {
      e.preventDefault();
      let y = i;
      let x = j;
      if (e.keyCode === 13) y += e.shiftKey ? -1 : 1; //enter
      if (e.keyCode === 37) x += -1; // left
      if (e.keyCode === 38) y += -1; // up
      if (e.keyCode === 39) x += 1; // right
      if (e.keyCode === 40) y += 1; // down
      if (x > columns.length - 1) {
        x = -1;
        y++;
      }
      if (x < -1) {
        x = columns.length - 1;
        y--;
      }
      if (y >= rows.length) y = 0;
      if (y < 0) y = rows.length - 1;
      changeTableFocus(y, x);
    }
  };
  const updateField = async ({ collection, query, update }) => {
    const formData = new FormData();
    formData.append('collection', collection);
    formData.append('query', JSON.stringify(query));
    formData.append('update', JSON.stringify(update));
    const response = await fetch('/api/db?/update', {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    socketio.emit('db.update.doc', { collection, doc });
  };

  // props (internal)
  let columnsSanitized = false;
  let tbodyElem;

  // props (external)
  export let collection = '';
  export let columns = [];
  export let editable = true;
  export let rows = [];
  export let sort = { index: 0 };

  // props (dynamic)
  $: if (columns.length > 0 && !columnsSanitized) {
    [columns, columnsSanitized] = sanitizeColumns(columns);
  }
  $: if (
    editable &&
    rows.length > 0 &&
    [...rows].filter((row) => row?._mongoTable === undefined).length > 0
  ) {
    rows = sanitizeRows(rows);
  }
  if (sort !== false) {
    if (sort?.direction === undefined) sort.direction = 1;
    if (sort?.index !== undefined)
      sort = {
        direction: sort.direction,
        key: columns[sort.index].key
      };
  }
  $: if ((sort.direction || sort.key) && rows.length > 0) {
    rows = [...rows].sort((a, b) => {
      const key = sort.key;
      if (a[key] < b[key]) return -1 * sort.direction;
      if (a[key] > b[key]) return 1 * sort.direction;
      return 0;
    });
  }
</script>

<div class="flex flex-grow overflow-y-auto p-[2rem] pt-0 mt-[2rem]">
  <Table>
    <Thead>
      {#if editable}
        <Th class="w-[32px]"><Checkbox on:click={checkboxClickHandler} /></Th>
      {/if}
      {#each columns as column}
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
    <tbody bind:this={tbodyElem} class={$theme.tbody}>
      {#each rows as row, i}
        <Tr>
          {#if editable}
            <Td class="w-[32px]">
              <Checkbox
                bind:checked={row._mongoTable.selected}
                on:keydown={(e) => {
                  keyDownHandler({ e, i, j: -1 });
                }}
              />
            </Td>
          {/if}
          {#each columns as column, j}
            {#if editable}
              {#if column.type === 'string'}
                <td
                  bind:innerHTML={row[column.key]}
                  class={$theme.td}
                  contenteditable="true"
                  on:blur={() => {
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
                />
              {/if}
            {:else}
              <Td>{mask[column.mask](row[column.key])}</Td>
            {/if}
          {/each}
        </Tr>
      {/each}
    </tbody>
  </Table>
</div>
