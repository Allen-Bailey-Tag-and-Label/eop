<script>
	// imports
	import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { DataTableToolbar, H3, Table } from '$components';

  // utilities
  const mapRows = row => {
    // check if checkbox hasn't been added already
    if (!('dataTableCheckbox' in row)) {
      row.dataTableCheckbox = {
        changeHandler: () => {},
        checked : false,
        indeterminate : false
      }
    }
    return row;
  }
  const sortRows = (a, b) => {
    // get value based on sort key
    let aValue = a[sort.key];
    let bValue = b[sort.key];

    // check if value is undefined
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';

    // check if value is a checkbox
    if (typeof aValue === 'object' && 'checked' in aValue) aValue = aValue.checked;
    if (typeof bValue === 'object' && 'checked' in bValue) bValue = bValue.checked;
    
    // compare values
    if (aValue < bValue) return -1 * sort.direction;
    if (aValue > bValue) return 1 * sort.direction;
    return 0;
  }

  // handlers
  const thCheckboxChangeHandler = () => {
    datatableColumns[0].checked = !datatableColumns[0].checked
    datatableColumns[0].indeterminate = false;
    rows = [...rows].map(row=>{
      row.dataTableCheckbox.checked = datatableColumns[0].checked;
      return row;
    })
  }

	// props (internal)
	const defaultClasses =
    'space-y-[1rem] overflow-hidden h-full flex flex-col flex-grow';
  let thCheckbox = {
    changeHandler: thCheckboxChangeHandler,
    checked : false,
    indeterminate : false,
    key: 'dataTableCheckbox', 
    type: 'checkbox',
  }

  // props (external)
	export let columns = [];
  export let editable = false;
  export let on = {};
  export let rows = [];
  export let sort = {
    direction: 1,
    key: ''
  }
	export let title = '';

	// props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);
  $: datatableColumns = (editable && columns.length > 0 && columns[0].key !== 'dataTableCheckbox') ? [thCheckbox, ...columns] : [...columns]
  $: datatableRows = (editable && rows.length > 0) ? [...rows].map(mapRows) : [...rows];
  $: checkedRows = [...datatableRows].filter(({dataTableCheckbox}) => dataTableCheckbox?.checked)
  $: if (sort) rows = [...rows].sort(sortRows);
  $: thCheckbox = {
    changeHandler: thCheckboxChangeHandler,
    checked : checkedRows.length === datatableRows.length,
    indeterminate : checkedRows.length > 0 && checkedRows.length < datatableRows.length,
    key: 'dataTableCheckbox', 
    type: 'checkbox',
  }

	// lifecycle
	const lifecycle = {
		destroy: () => {},
		mount: async () => {}
  };
	onMount(async () => {
		await lifecycle.mount();
		return () => {
			lifecycle.destroy();
		};
	});
</script>

<div
  class={classes}
>
  <slot name="top">
    <div class="flex justify-between items-center">
      <H3>{title}</H3>
      <slot name="toolbar">
        <DataTableToolbar
          bind:columns
          bind:on
          bind:rows={datatableRows}
        />
      </slot>
    </div>
  </slot>
  <slot>
    <Table
      bind:columns={datatableColumns}
      bind:sort
      bind:rows={datatableRows}
    />
  </slot>
</div>
<slot />
