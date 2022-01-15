<script>
  // imports
  import { onMount } from 'svelte';
  import { Icon, Download } from 'svelte-hero-icons';
  import { twMerge } from 'tailwind-merge';
  import { browser } from '$app/env';
  import { Button, Fieldset, Offscreen, Radio } from '$components';
  import { saveAs } from '$lib/export'

  // utilities
  const copyToClipboard = () => {
    // check if in the browser
    if ( browser ) {
      // initiate data
      let data = [];

      // add columns
      data.push([...columns].map(({ key }) => key).join("\t"))

      // get rowData
      const rowData = range === 'All' ? rows : selectedRows;

      // loop over rowData
      rowData.forEach(row => {
        // initiate rowData
        const rowData = [];

        // loop over columns
        columns.forEach(({ key }) => {
          rowData.push(row[key]);
        })

        // push rowData into data
        data.push(rowData.join("\t"));
      })

      // join data
      data = data.join("\n");

      // copy text to clipboard
      navigator.clipboard.writeText(data);
    }
  }

  // handlers
  const clickHandler = () => show = !show;
  const submitHandler = async () => {
    // check if form hasn't been submitted
    if (!submitted) {
      // update submitted
      submitted = true;

      try {
        // initiate options
        const options = {
          columns,
          rows : range === 'All' ? rows : selectedRows,
          type
        }
        
        // check for type logic
        if (type === 'csv' || type === 'xlsx') await saveAs(options)
        if (type === 'clipboard') copyToClipboard();

        // update show
        show = false;
      } catch (message) {
        error = message;
      }
      // update submitted;
      submitted = false;
    }
  }

  // props (internal)
  const defaultClasses = 'relative';
  let error = '';
  let range = 'All';
  let ranges = [
    'All',
    'Selected'
  ]
  let show = false;
  let submitted = false;
  let type = 'xlsx';
  const types = [
    { label: '.CSV', value: 'csv' },
    { label: '.XLSX', value: 'xlsx' },
    { label: 'Clipboard', value: 'clipboard' }
  ]

  // props (external)
  export let columns = [];
  export let rows = [];

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);
  $: selectedRows = [...rows].filter(({dataTableCheckbox})=>dataTableCheckbox?.checked);

  // lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {},
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<div
  class={classes}
>
  <Button
    on:click={clickHandler}
    type='icon'
  >
    <Icon src={Download} class='w-[1.25rem] h-[1.25rem]' />
  </Button>
</div>

<Offscreen
  bind:show
  direction='right'
>
  <form
    class="flex flex-col space-y-[2rem] p-[1rem] min-w-[15.625rem] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-thumb-rounded"
    on:submit|preventDefault={submitHandler}
  >
    <Fieldset class='space-y-0'>
      <div>Export to</div>
      {#each types as { label, value }}
        <Radio
          bind:group={type}
          {value}
        >
          {label}
        </Radio>
      {/each}
    </Fieldset>
    <Fieldset class='space-y-0'>
      <div>Range</div>
      {#each ranges as value}
        <Radio
          bind:group={range}
          {value}
        >
          {value}
        </Radio>
      {/each}
    </Fieldset>
    <div class='text-red-500'>{error}</div>
    <Button type="submit">Export</Button>
  </form>

</Offscreen>
<slot/>