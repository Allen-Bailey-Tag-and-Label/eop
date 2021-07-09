<script>
  // _imports
  import { page } from '$app/stores';
  import { serverFetch } from '$lib/_helpers';
  import { grow, shrink } from '$lib/_transitions';
  import { onMount } from 'svelte';

  // components
  import * as Buttons from './Button'
  import Card from './Card.svelte'
  import Checkbox from './Checkbox.svelte'
  import Spinner from './Spinner.svelte'
  import Icon, { Plus, Trash } from 'svelte-hero-icons';

  // handlers
  const checkboxChangeHandler = () => {
    rows = rows.map(row=>{
      row.checked = checked ? false : true;
      return row;
    })
  }
  const deleteClickHandler = () => {
    modal.confirmation.show(`Are you sure you want to delete ${checkedRows.map(row=>`"${row.name}"`).join(', ')}?`, deleteRowHandler)
  }
  const deleteRowHandler = async () => {
    modal.spinner.show();
    await serverFetch({method:'DELETE', href:`/api/datatable/${collection}`, body:checkedRows.map(row=>row._id)});
    await getData();
    modal.spinner.hide();
  }
  const getData = async() => {
    const data = await serverFetch(`/api/datatable/${collection}?sort=${JSON.stringify(sort)}`);
    rows = data.rows.map(row=>Object.assign({checked:false}, row));
  }

  // props ( external )
  export let collection = '';
  export let columns = [];
  export let sort = {};

  // props ( internal )
  const cellClasses = "p-[10px]"
  let loaded = false;
  let rows = [];

  // props ( dynamic )
  $: checkedRows = [...rows].filter(row=>row.checked)
  $: checked = checkedRows.length === rows.length;
  $: indeterminate = checkedRows.length !== 0 && checkedRows.length !== rows.length;
  $: showDelete = checkedRows.length > 0 ? true : false;

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await getData();
    loaded = true;
  })
</script>

<Card class="items-center space-y-[16px]">
  {#if !loaded}
    <Spinner />
  {:else}
    <div class="flex justify-end w-full">
      <div class="flex space-x-[8px]">
        {#if showDelete}
          <div class="flex" in:grow out:shrink>
            <Buttons.Icon on:click={deleteClickHandler} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
          </div>
        {/if}
        <Buttons.Icon type="link" href={`${$page.path}/add`}><Icon src={Plus} class="w-[24px] h-[24px]"/></Buttons.Icon>
      </div>
    </div>
    <div class="overflow-auto w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-track-rounded-full">
      <table class="w-full">
        <thead>
          <th class="{cellClasses} w-[24px]"><Checkbox on:change={checkboxChangeHandler} bind:checked bind:indeterminate /></th>
          {#each columns as {title}}
            <th class="{cellClasses}">{title}</th>
          {/each}
        </thead>
        <tbody>
          {#each rows as row}
            <tr id={row._id}>
              <td class="{cellClasses}"><Checkbox bind:checked={row.checked} /></td>
              {#each columns as {key}}
                <td class="{cellClasses}">{key in row ? row[key] : ''}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>