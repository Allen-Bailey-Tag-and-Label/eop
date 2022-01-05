<script>
  // imports
  // import { page } from '$app/stores';
  import modal from '$components/Modal/store';
  import { serverFetch } from '$lib/_helpers.js';
  import { grow, shrink } from '$lib/_transitions';
  // import auth from '$lib/auth';
  // import moment from 'moment';
  import { onMount } from 'svelte';
  import defaultCategoryOptions from './categoryOptions';
  
  // components
  import { Buttons, Card, Checkbox, Section, Select, Table } from '$components';
  import Icon, { Plus, Trash } from 'svelte-hero-icons';
  
  // utilities
  const getFAQDocuments = async () => {
    // get all faq documents
    const { rows: documents } = await serverFetch('/api/datatable/faq');

    // update rows
    rows = documents
      .map(row=>{
        row.checked = false;
        return row;
      })
      .sort((a,b)=>{
        if ( a.category < b.category ) return -1;
        if ( a.category > b.category ) return 1;
        return 0;
      });
  }
  
  // handlers
  const checkboxChangeHandler = async () => {
    rows = rows.map(row=>{
      row.checked = checked ? false : true;
      return row;
    })
  }
  const deleteClickHandler = async () => {
    // create confirmation modal
    const confirmFn = async () => {
      // show spinner modal
      modal.spinner.show();

      try {
        // wait until all docs have been deleted
        await Promise.all([checkedRows.map(async ({_id}) => {
          await serverFetch({
            href: `/api/datatable/faq?_id=${_id}`,
            method: 'DELETE',
          })
        })])

        // update rows
        await getFAQDocuments();

        // show success modal
        modal.success.show('Successfully deleted questions.')

      } catch (error) {
        modal.error.show(error);
      }

      // hide spinner modal
      modal.spinner.hide();
    }
    modal.confirmation.show(`Are you sure you want to delete ${checkedRows.length} question${checkedRows.length === 1 ? '' : 's'}?`, confirmFn);
  }
  
  // props (internal)
  let category = 'All';
  const categoryOptions = [
    ...defaultCategoryOptions,
    { label: 'All', value: 'All' },
  ].sort((a,b)=>a.label < b.label ? -1 : a.label > b.label ? 1 : 0)
  const cellClasses = "p-[10px]"
  let rows = [];
  
  // props (external)
  
  // props (dynamic)
  $: filteredRows = [...rows].filter(row=>category === 'All' ? true : row.category === category);
  $: checkedRows = [...filteredRows].filter(row=>row.checked)
  $: checked = checkedRows.length === filteredRows.length;
  $: indeterminate = checkedRows.length !== 0 && checkedRows.length !== filteredRows.length;
  $: showDelete = checkedRows.length > 0;

  // lifecycle
  const lifecycle = {
    destroy: async () => {},
    mount: async () => {
      await getFAQDocuments();
    },
  };
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  });
</script>

<Section>
  <Card class="space-y-[2rem]">
    <!-- top bar -->
    <div class="flex justify-between items-end">
      <Select label="Category" options={categoryOptions} bind:value={category} />
      <!-- buttons -->
      <div class="flex space-x-[.5rem]">
        {#if showDelete}
          <div in:grow out:shrink class="flex">
            <Buttons.Icon on:click={deleteClickHandler} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
          </div>
        {/if}
        <Buttons.Icon type="link" href={`./faq-management/add`}><Icon src={Plus} class="w-[24px] h-[24px]"/></Buttons.Icon>
      </div>
    </div>
    <Table>
      <thead slot="thead">
        <th class="{cellClasses} w-[24px]"><Checkbox on:change={checkboxChangeHandler} bind:checked bind:indeterminate /></th>
        <th class="{cellClasses}">Category</th>
        <th class="{cellClasses}">Question</th>
        <th class="{cellClasses}">Answer</th>
      </thead>
      <tbody slot="tbody">
        {#each filteredRows as row}
          <tr>
            <td><Checkbox bind:checked={row.checked} /></td>
            <td>{row.category}</td>
            <td>{row.question}</td>
            <td>{row.answer}</td>
          </tr>
        {/each}
      </tbody>
    </Table>
  </Card>
</Section>
<slot/>