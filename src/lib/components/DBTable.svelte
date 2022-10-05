<script>
  import { twMerge } from 'tailwind-merge';
  import { browser } from '$app/environment';
  import {
    Button,
    Checkbox,
    ContextMenu,
    DBThead,
    DBTr,
    DBPagination,
    Fieldset,
    Icon,
    Select,
    Table,
    Td,
    Th,
    Thead,
    Tr
  } from '$components';
  import { Check } from '$icons';
  import { sanitizeColumns, sanitizeRows } from '$lib/mongoTable';
  import { clientConnection as socketio } from '$lib/socketio';
  import { theme } from '$stores';

  // utilities
  const changeTableFocus = (i, j) => {
    if (browser) {
      const query = `tr:nth-child(${i + 1}) td[contenteditable=true], tr:nth-child(${
        i + 1
      }) input, tr:nth-child(${i + 1}) select`;
      const newElement = tbodyElem.querySelectorAll(query)[j + 1];
      newElement.focus();
      try {
        const length = newElement.innerHTML.replace('<br>', '').length;
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(newElement.childNodes[0], length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (error) {}
    }
  };
  const sortRows = () => {
    sort.previous = {
      direction: sort.direction,
      key: sort.key
    };
    rows = [...rows].sort((a, b) => {
      const key = sort.key;
      const type = columns?.find((column) => column.key === key)?.type;
      if (type === 'currency') {
        if (a?.[key] === undefined || a?.[key] === '') return 1 * sort.direction;
        if (b?.[key] === undefined || b?.[key] === '') return -1 * sort.direction;
        return +a[key] < +b[key] ? -1 * sort.direction : +a[key] > +b[key] ? 1 * sort.direction : 0;
      }
      if (type === 'select') {
        const column = columns.find((column) => column.key === key);
        const aValue = column.options.find((option) => option.value === a[key])?.label;
        const bValue = column.options.find((option) => option.value === b[key])?.label;
        return aValue === undefined
          ? 1 * sort.direction
          : bValue === undefined
          ? -1 * sort.direction
          : aValue < bValue
          ? -1 * sort.direction
          : aValue > bValue
          ? 1 * sort.direction
          : 0;
      }
      if (a[key] < b[key]) return -1 * sort.direction;
      if (a[key] > b[key]) return 1 * sort.direction;
      return 0;
    });
  };

  // handlers
  const keyDownHandler = ({ e, i, j, keyCodes = [13, 37, 38, 39, 40] }) => {
    // check if key should be prevented
    if (keyCodes.includes(e.keyCode)) {
      e.preventDefault();
      let y = i;
      let x = j;
      if (e.keyCode === 13 && keyCodes.includes(13)) y += e.shiftKey ? -1 : 1; //enter
      if (e.keyCode === 37 && keyCodes.includes(37)) x += -1; // left
      if (e.keyCode === 38 && keyCodes.includes(38)) y += -1; // up
      if (e.keyCode === 39 && keyCodes.includes(39)) x += 1; // right
      if (e.keyCode === 40 && keyCodes.includes(40)) y += 1; // down
      if (x > columns.length - 1) {
        x = -1;
        y++;
      }
      if (x < -1) {
        x = columns.length - 1;
        y--;
      }
      if (y >= paginatedRows.length) y = 0;
      if (y < 0) y = paginatedRows.length - 1;
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
  let tbodyElem;

  // props (external)
  export let collection = '';
  export let columns = [];
  export let editable = true;
  export let filters = [];
  export let methods = {
    update: {
      rows: (arr) => {
        // check if initial data
        const init = rows.length === 0;
        rows = [
          ...rows
            .filter(({ _id }) => arr.some((obj) => obj._id === _id))
            .map((obj1) => {
              return { ...obj1, ...arr.find((obj2) => obj1._id === obj2._id) };
            }),
          ...arr.filter(({ _id }) => !rows.some((obj) => obj._id === _id))
        ];
        if (init) sortRows();
      }
    }
  };
  export let pagination = {
    length: undefined,
    page: undefined
  };
  export let rows = [];
  export let sort = { index: 0 };

  // props (dynamic)
  $: if (columns.length > 0) {
    [columns] = sanitizeColumns(columns);
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
        key: columns?.[sort.index]?.key
      };
    if (sort?.previous === undefined) {
      sort.previous = {
        direction: undefined,
        key: undefined
      };
    }
  }
  $: if (sort.direction !== sort.previous.direction || sort.key !== sort.previous.key) sortRows();
  $: filteredRows =
    filters.length === 0
      ? rows
      : [...rows].filter((row) => {
          let include = true;
          for (let i = 0; i < filters.length; i++) {
            const { field, operator, value } = filters[i];
            if (
              (operator === 'contains' && !new RegExp(value[0], 'i').test(row[field])) ||
              (operator === 'does not contain' && new RegExp(value[0], 'i').test(row[field])) ||
              (operator === 'ends with' && !new RegExp(`${value[0]}$`, 'i').test(row[field])) ||
              (operator === 'is' && !new RegExp(`^${value[0]}$`, 'i').test(row[field])) ||
              (operator === 'is after' && row[field] <= value[0]) ||
              (operator === 'is before' && row[field] >= value[0]) ||
              (operator === 'is between' && (row[field] < value[0] || row[field] > value[1])) ||
              (operator === 'is not' && new RegExp(`^${value[0]}$`, 'i').test(row[field])) ||
              (operator === 'starts with' && !new RegExp(`^${value[0]}`, 'i').test(row[field]))
            ) {
              include = false;
              break;
            }
          }
          return include;
        });
  $: paginatedRows =
    pagination === undefined
      ? [...filteredRows]
      : [...filteredRows].slice(
          pagination.page * pagination.length,
          (pagination.page + 1) * pagination.length
        );
</script>

<div class="flex flex-col overflow-hidden space-y-[1rem] p-[2rem]">
  <div class="flex overflow-y-auto mx-[-2rem] px-[2rem] lg:mx-0 lg:px-0">
    <Table>
      <DBThead {columns} bind:rows bind:sort {editable} />
      <tbody bind:this={tbodyElem} class={$theme.tbody}>
        {#each paginatedRows as row, i}
          <DBTr>
            {#if editable}
              <Td class="w-[32px]">
                <Checkbox>
                  <svelte:fragment slot="input">
                    <input
                      bind:checked={row._mongoTable.selected}
                      class="peer absolute top-0 left-0 opacity-0 w-0"
                      on:keydown={(e) => {
                        keyDownHandler({ e, i, j: -1 });
                      }}
                      type="checkbox"
                    />
                  </svelte:fragment>
                  <svelte:fragment slot="handle">
                    <div
                      class={twMerge(
                        'transition duration-200',
                        $theme.checkbox,
                        !row._mongoTable.selected ? '' : $theme.checkboxChecked,
                        $$props.class
                      )}
                    >
                      <Icon
                        class="transition duration-200 transform {!row._mongoTable.selected
                          ? 'scale-[0]'
                          : 'scale-[1]'}"
                        src={Check}
                      />
                    </div>
                  </svelte:fragment>
                </Checkbox>
              </Td>
            {/if}
            {#each [...columns].filter(({ type }) => type !== 'hidden') as column, j}
              <svelte:component
                this={column.component}
                bind:value={row[column.key]}
                {collection}
                {column}
                {editable}
                {i}
                {j}
                {keyDownHandler}
                {row}
                {updateField}
              />
            {/each}
          </DBTr>
        {/each}
      </tbody>
    </Table>
  </div>
  <DBPagination bind:filteredRows bind:length={pagination.length} bind:page={pagination.page} />
</div>
