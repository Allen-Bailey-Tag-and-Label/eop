<!-- TODO - Add Sort functionality -->
<script>
  import { browser } from '$app/environment';
  import { Checkbox, Table, Td, Th, Thead, Tr } from '$components';
  import { postFetch } from '$lib/helpers';
  import { sanitizeColumns, sanitizeRows } from '$lib/mongoTable';
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
    const response = await postFetch({
      body: { collection, query, update },
      url: '/api/db/update'
    });
    const { doc } = await response.json();
    socketio.emit('db.update', { collection, doc });
  };

  // props (internal)
  let columnsSanitized = false;
  let tbodyElem;

  // props (external)
  export let collection = '';
  export let columns = [];
  export let rows = [];

  // props (dynamic)
  $: if (columns.length > 0 && !columnsSanitized) {
    [columns, columnsSanitized] = sanitizeColumns(columns);
  }
  $: if (rows.length > 0 && [...rows].filter((row) => row?._mongoTable === undefined).length > 0) {
    rows = sanitizeRows(rows);
  }
</script>

<div class="flex flex-grow overflow-y-auto p-[2rem] pt-0 mt-[2rem]">
  <Table>
    <Thead>
      <Th class="w-[32px]"><Checkbox on:click={checkboxClickHandler} /></Th>
      {#each columns as column}
        <Th>{column.innerHTML}</Th>
      {/each}
    </Thead>
    <tbody bind:this={tbodyElem} class={$theme.tbody}>
      {#each rows as row, i}
        <Tr>
          <Td class="w-[32px]">
            <Checkbox
              bind:checked={row._mongoTable.selected}
              on:keydown={(e) => {
                keyDownHandler({ e, i, j: -1 });
              }}
            />
          </Td>
          {#each columns as column, j}
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
          {/each}
        </Tr>
      {/each}
    </tbody>
  </Table>
</div>
