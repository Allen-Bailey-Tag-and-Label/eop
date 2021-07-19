<script>
  // _imports
  import { onMount } from 'svelte';
  import { serverFetch } from '$lib/_helpers';
  import { grow, shrink } from '$lib/_transitions';

  // components
  import { Buttons, Card, Checkbox, Section, Select, Spinner } from '$components';
  import Icon, { Plus, Save, Trash } from 'svelte-hero-icons';

  // handlers
  const checkboxChangeHandler = async () => {
    rows = rows.map(row=>{
      row.checked = checked ? false : true;
      return row;
    })
  }
  const deleteClickHandler = () => {
    modal.confirmation.show(`Are you sure you want to delete role "${roles.filter(role=>role._id===roleId)[0].name}"?`, deleteRowHandler)
  }
  const deleteRowHandler = async () => {
    modal.spinner.show();
    await serverFetch({method:'DELETE', href:`/api/datatable/roles?_id=${roleId}`})
    roleId = '';
    await getRoles();
    modal.spinner.hide();
  }
  const getRoutes = async() => {
    const data = await serverFetch(`/api/datatable/routes`);
    rows = data.rows.map(row=>Object.assign({checked:false}, row));
  }
  const getRoles = async() => {
    const data = await serverFetch('/api/datatable/roles');
    roles = data.rows;
    roleOptions = [{value:'', label:'Select a Role'}, ...data.rows.map(role=>{return{value:role._id,label:role.name, ...role}})];
  }
  const roleChangeHandler = async() => {
    uncheckRows();
    if ( roleId !== '' ) {
      modal.spinner.show();
      const data = await serverFetch(`/api/datatable/roles?_id=${roleId}`);
      const roleRoutes = data.rows[0].routes.map(row=>row._id);
      initialRoutes = [...data.rows[0].routes];
      rows = rows.map(row=>{
        row.checked = roleRoutes.includes(row._id) ? true : false;
        return row
      })
      modal.spinner.hide();
    } else {
      initialRoutes = []
    }
  }
  const saveClickHandler = async() => {
    modal.spinner.show();
    const routes = [...checkedRows].map(row=>{delete row.checked; return row});
    const data = await serverFetch({method:'PATCH', href: `/api/datatable/roles?_id=${roleId}`, body: {routes}});
    const roleRoutes = data.doc.routes.map(row=>row._id);
    initialRoutes = [...data.doc.routes];
    rows = rows.map(row=>{
      row.checked = roleRoutes.includes(row._id) ? true : false;
      return row
    })
    modal.spinner.hide();
  }
  const uncheckRows = () => {
    rows = [...rows].map(row=>{return {...row, checked:false}})
  }

  // props ( external )
  export let columns = [
    {title:'Group', key:'group'},
    {title:'Name', key:'name'},
    {title:'Route', key:'href'},
  ];

  // props ( internal )
  const cellClasses = "p-[10px]"
  let loaded = false;
  let initialRoutes = [];
  let roles = [];
  let roleOptions = [];
  let roleId = '';
  let rows = [];

  // props ( dynamic )
  $: checkedRows = [...rows].filter(row=>row.checked)
  $: checked = checkedRows.length === rows.length;
  $: indeterminate = checkedRows.length !== 0 && checkedRows.length !== rows.length;
  $: showDelete = roleId !== '' ? true : false;
  $: roleChanged = roleId !== '' && [...rows].filter(row=>row.checked).map(row=>row._id).sort().join(',') !== [...initialRoutes].map(row=>row._id).sort().join(',') ? true : false;

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await Promise.all([getRoutes(), getRoles()]);
    loaded = true;
  })
</script>

<Section class="space-y-[16px]">
  <Card class="items-center space-y-[16px]">
    {#if !loaded}
      <Spinner />
    {:else}
      <div class="flex justify-between w-full items-center space-x-[16px]">
        <Select bind:value={roleId} options={roleOptions} on:change={roleChangeHandler} class="flex-grow-0" />
        <div class="flex justify-end">
          <div class="flex space-x-[8px]">
            {#if roleChanged}
              <div in:grow out:shrink class="flex">
                <Buttons.Icon on:click={saveClickHandler} theme="success"><Icon src={Save} class="w-[24px] h-[24px]"/></Buttons.Icon>
              </div>
            {/if}
            {#if showDelete}
              <div in:grow out:shrink class="flex">
                <Buttons.Icon on:click={deleteClickHandler} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
              </div>
            {/if}
            <Buttons.Icon type="link" href={`./roles/add`}><Icon src={Plus} class="w-[24px] h-[24px]"/></Buttons.Icon>
          </div>
        </div>
      </div>
      {#if roleId !== ''}
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
      {/if}
    {/if}
  </Card>
</Section>