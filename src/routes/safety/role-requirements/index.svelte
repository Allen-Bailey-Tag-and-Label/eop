<script>
  // _imports
  import { serverFetch } from '$lib/_helpers';
  import { grow, shrink } from '$lib/_transitions';
  import { onMount } from 'svelte';

  // components
  import { Buttons, Card, Checkbox, Section, Select, Spinner, Table } from '$components';
  import Icon, { Save } from 'svelte-hero-icons'

  // handlers
  const checkboxChangeHandler = async () => {
    safetyItems = safetyItems.map(row=>{
      row.checked = checked ? false : true;
      return row;
    })
  }
  const getRoles = async() => {
    const data = await serverFetch(`/api/datatable/roles?sort=${JSON.stringify({name:1})}`);
    roles = [
      { label: 'Select a Role', value: ''},
      ...data.rows.map(row=>{
        return { label: row.name, value: row._id};
      })
    ]
  }
  const getSafetyTypes = async() => {
    const data = await serverFetch(`/api/datatable/safety-types?sort=${JSON.stringify({name:1})}`);
    safetyItems = data.rows.map(row=>Object.assign({checked:false}, row))
  }
  const roleChangeHandler = async() => {
    uncheckRows();
    if ( roleId !== '' ) {
      modal.spinner.show();
      const data = await serverFetch(`/api/datatable/roles?_id=${roleId}`);
      const roleSafetyItems = 'safetyItems' in data.rows[0] ? data.rows[0].safetyItems.map(row=>row._id) : [];
      initialSafetyItems = 'safetyItems' in data.rows[0] ? [...data.rows[0].safetyItems] : [];
      safetyItems = safetyItems.map(row=>{
        row.checked = roleSafetyItems.includes(row._id) ? true : false;
        return row
      })
      modal.spinner.hide();
    } else {
      initialSafetyItems = []
    }
  }
  const saveClickHandler = async() => {
    modal.spinner.show();
    const items = [...checkedRows].map(row=>{delete row.checked; return row});
    const data = await serverFetch({method:'PATCH', href: `/api/datatable/roles?_id=${roleId}`, body:{safetyItems: items}});
    const roleSafetyItems = data.doc.safetyItems.map(row=>row._id);
    initialSafetyItems = [...data.doc.safetyItems];
    safetyItems = safetyItems.map(row=>{
      row.checked = roleSafetyItems.includes(row._id) ? true : false;
      return row;
    })
    modal.spinner.hide();
  }
  const uncheckRows = () => {
    safetyItems = [...safetyItems].map(row=>{return {...row, checked:false}})
  }

  // props ( internal )
  const cellClasses = "p-[10px]"
  let columns = [
    {title: 'Name', key: 'name'},
  ]
  let initialSafetyItems = [];
  let loaded = false;
  let roleId = '';
  let roles = [];
  let safetyItems = [];

  // props ( dynamic )
  $: checkedRows = [...safetyItems].filter(row=>row.checked)
  $: checked = checkedRows.length === safetyItems.length;
  $: indeterminate = checkedRows.length !== 0 && checkedRows.length !== safetyItems.length;
  $: roleChanged = roleId !== '' && [...safetyItems].filter(row=>row.checked).map(row=>row._id).sort().join(',') !== [...initialSafetyItems].map(row=>row._id).sort().join(',') ? true : false;

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await Promise.all([getRoles(), getSafetyTypes()]);
    loaded = true;
  })
</script>

<Section>
  <Card class="items-center space-y-[16px]">
    {#if loaded}
      <div class="flex justify-between w-full items-center space-x-[16px]">
        <Select options={roles} on:change={roleChangeHandler} bind:value={roleId} class="flex-grow-0" />
        <div class="flex space-x-[8px]">
          {#if roleChanged}
            <div in:grow out:shrink class="flex">
              <Buttons.Icon on:click={saveClickHandler} theme="success"><Icon src={Save} class="w-[24px] h-[24px]"/></Buttons.Icon>
            </div>
          {/if}
        </div>
      </div>
      {#if roleId !== ''}
        <Table>
          <thead slot="thead">
            <th class="{cellClasses} w-[24px]"><Checkbox on:change={checkboxChangeHandler} bind:checked bind:indeterminate /></th>
            {#each columns as {title, ...column}}
              <th class="{cellClasses} {column?.type === 'checkbox' ? 'w-[24px]' :''}">{title}</th>
            {/each}
          </thead>
          <tbody slot="tbody">
            {#each safetyItems as row, i}
              <tr class="rounded transition duration-200 bg-white bg-opacity-0 hover:bg-opacity-[2%]">
                <td class="{cellClasses}"><Checkbox bind:checked={row.checked} /></td>
                {#each columns as {key, ...column}}
                  <td class={cellClasses}>
                    {#if column?.type === 'checkbox'}
                      <div class="flex justify-center">
                        <Checkbox bind:checked={row[key]} />
                      </div>
                    {:else}
                      {row[key]}
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </Table>
      {/if}
    {:else}
      <Spinner />
    {/if}
  </Card>
</Section>