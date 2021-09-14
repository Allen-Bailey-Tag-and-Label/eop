<script>
  // _imports
  import { page } from '$app/stores';
  import { serverFetch } from '$lib/_helpers';
  import { grow, shrink } from '$lib/_transitions';
  import { onMount } from 'svelte';
  import moment from 'moment';

  // components
  import * as Buttons from './Button'
  import Card from './Card.svelte'
  import Checkbox from './Checkbox.svelte'
  import Spinner from './Spinner.svelte'
  import Table from './Table.svelte'
  import Icon, { Pencil, Plus, Trash } from 'svelte-hero-icons';

  // handlers
  const checkboxChangeHandler = () => {
    rows = rows.map(row=>{
      row.checked = checked ? false : true;
      return row;
    })
  }
  const deleteClickHandler = () => {
    modal.confirmation.show(`Are you sure you want to delete ${checkedRows.map(row=>deleteModalFN(row)).join(', ')}?`, deleteRowHandler)
  }
  const deleteRowHandler = async () => {
    modal.spinner.show();
    await Promise.all([checkedRows.map(async ({_id})=>{
      await serverFetch({method:'DELETE', href:`/api/datatable/${collection}?_id=${_id}`});
    })])
    await getData();
    modal.spinner.hide();
  }
  const getData = async() => {
    const data = await serverFetch(`/api/datatable/${collection}?sort=${JSON.stringify(sort)}`);
    rows = data.rows.map(row=>Object.assign({checked:false}, row));
  }

  // props ( external )
  export let checkedRows = [];
  export let collection = '';
  export let deleteModalFN = row => row[columns[0].key]
  export let columns = [];
  export let editable = false;
  export let sort = {};

  // props ( internal )
  const cellClasses = "p-[10px]"
  let loaded = false;
  let rows = [];

  // props ( dynamic )
  $: checked = checkedRows.length === rows.length;
  $: editURL = checkedRows.length === 1 ? `${$page.path}/edit?_id=${checkedRows[0]._id}` : '';
  $: indeterminate = checkedRows.length !== 0 && checkedRows.length !== rows.length;
  $: showDelete = checkedRows.length > 0 ? true : false;
  $: showEdit = checkedRows.length === 1 ? true : false;
  $: if ( true ) {
    checkedRows = [...rows].filter(row=>row.checked);
  }

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
    {#if editable}
      <div class="flex justify-end w-full">
        <div class="flex space-x-[8px]">
          <slot name="toolbar" />
          {#if showEdit}
            <div class="flex" in:grow out:shrink>
              <Buttons.Icon type="link" href={editURL} theme="secondary"><Icon src={Pencil} class="w-[24px] h-[24px]"/></Buttons.Icon>
            </div>
          {/if}
          {#if showDelete}
            <div class="flex" in:grow out:shrink>
              <Buttons.Icon on:click={deleteClickHandler} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
            </div>
          {/if}
          <Buttons.Icon type="link" href={`${$page.path}/add`}><Icon src={Plus} class="w-[24px] h-[24px]"/></Buttons.Icon>
        </div>
      </div>
    {/if}
    <Table>
      <thead slot="thead">
        {#if editable}
          <th class="{cellClasses} w-[24px]"><Checkbox on:change={checkboxChangeHandler} bind:checked bind:indeterminate /></th>
        {/if}
        {#each columns as {title}}
          <th class="{cellClasses}">{title}</th>
        {/each}
      </thead>
      <tbody slot="tbody">
        {#each rows as row}
          <tr id={row._id} class="rounded transition duration-200 bg-white bg-opacity-0 hover:bg-opacity-[2%]">
            {#if editable}
              <td class="{cellClasses}"><Checkbox bind:checked={row.checked} /></td>
            {/if}
            {#each columns as {key, ...column}}
              <td class="{cellClasses} {column?.type === 'date' ? 'text-right' :''}">
                {#if key in row}
                  {#if 'options' in column}
                    {column.options.filter(option=>option.value===row[key])[0]?.label ?? ''}
                  {:else if 'type' in column}
                    {#if column.type === 'date'}
                      {moment(row[key], 'x').format('MM.DD.YYYY')}
                    {:else if column.type === 'select'}
                      {key in row ? row[key] : ''}
                    {/if}
                  {:else}
                    {key in row ? row[key] : ''}
                  {/if}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </Table>
  {/if}
</Card>