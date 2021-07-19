<script>
  // _imports
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers';
  import { onMount } from 'svelte';

  // components
  import { Card, Checkbox, Section, Select, Spinner, Table } from '$components';

  // handlers
  const filterUsers = () => {
    const applicableRoles = [...roles].filter(role=>role.safetyItems.map(obj=>obj.name).includes(safetyType)).map(role=>role.name);
    const applicableUsers = [...users].filter(user=>{
      return user.roles.filter(role=>applicableRoles.includes(role)).length > 0
    }).map(user=>{
      user.checked = [...safetyHistory].filter(obj=>obj.id === user._id && obj.safetyType === safetyType).length === 1 ? true : false;
      return user
    });
    return applicableUsers;
  }
  const getPeriodOptions = () => {
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const initialYear = 2020;
    const safetyTypeMonth = [...safetyTypes].filter(({name})=>name === safetyType)[0].month;
    const months = ((currentYear - initialYear) * 12) - safetyTypeMonth + currentMonth;
    const years = Math.ceil(months / 12)
    const options =  [...Array(years).keys()].map((_,i)=>{
      const dateStart = new Date(initialYear + i, safetyTypeMonth, 1);
      const dateEnd = new Date(initialYear + i, safetyTypeMonth+11, 1);
      return { label: `${dateStart.toLocaleString('default', { month: 'long'})} ${dateStart.getFullYear()} - ${dateEnd.toLocaleString('default', { month: 'long'})} ${dateEnd.getFullYear()}`, value: dateStart.getFullYear() }
    }).reverse();
    period = options[0].value;
    return options;
  }
  const getRoles = async() => {
    const data = await serverFetch(`/api/datatable/roles?sort=${JSON.stringify({name:1})}`);
    roles = data.rows;
  }
  const getSafetyHistory = async() => {
    const data = await serverFetch(`/api/datatable/safety-history`);
    safetyHistory = data.rows;
  }
  const getSafetyTypes = async() => {
    const data = await serverFetch(`/api/datatable/safety-types?sort=${JSON.stringify({name:1})}`);
    safetyTypes = data.rows;
    safetyTypeOptions = [ {label: '-- Select a Safety Item', value: ''}, ...data.rows.map(row=>{return {label: row.name, value: row.name}}) ];
  }
  const getUsers = async() => {
    const data = await serverFetch(`/api/datatable/users?sort=${JSON.stringify({firstName: 1, lastName: 1})}`);
    users = data.rows;
  }
  const updateSafetyItem = async (e, {_id}) => {
    const checked = e.target.checked;
    const query = {
      id : _id,
      safetyType
    }
    if ( period !== '' ) query.period = period;
    if ( !checked ) await serverFetch({method:'DELETE', href: `/api/datatable/safety-history?${objectToUrlQueryParams(query)}`});
    if ( checked ) await serverFetch({method:'POST', href:`/api/datatable/safety-history`, body:query});
    await getSafetyHistory();
  }

  // props ( internal )
  const cellClasses = "p-[10px]"
  let columns = [
    {title: 'First Name', key: 'firstName'},
    {title: 'Last Name', key: 'lastName'},
  ]
  let loaded = false;
  let period = '';
  let roles = [];
  let safetyHistory = [];
  let safetyType = '';
  let safetyTypes = [];
  let safetyTypeOptions = [];
  let users = [];
  
  // props ( dynamic )
  $: rows = safetyType === '' ? [] : filterUsers()
  $: periodOptions = safetyType === '' ? [] : getPeriodOptions();
  $: if ( safetyType === '' ||  safetyTypes.filter(obj=>obj.name === safetyType)[0].frequency === 'At Hire') period = '';

  onMount(async() => {
    await Promise.all([getRoles(), getSafetyHistory(), getSafetyTypes(), getUsers()]);
    loaded = true;
  })
</script>

<Section>
  <Card class="items-center space-y-[16px]">
    {#if loaded}
      <div class='w-full flex justify-start space-x-[16px]'>
        <Select label="Safety Type" placeholder="Safety Type" options={safetyTypeOptions} bind:value={safetyType} />
        {#if safetyType !== '' && safetyTypes.filter(obj=>obj.name === safetyType)[0].frequency !== 'At Hire'}
          <Select label="Period" placeholder="Period" options={periodOptions} bind:value={period} />
        {/if}
      </div>
      {#if rows.length > 0}
        <Table>
          <thead slot="thead">
            <th class="{cellClasses} w-[24px]">Completed</th>
            {#each columns as {title}}
              <th class={cellClasses}>{title}</th>
            {/each}
          </thead>
          <tbody slot="tbody">
            {#each rows as row, i}
              <tr class="rounded transition duration-200 bg-white bg-opacity-0 hover:bg-opacity-[2%]">
                <td class={cellClasses}>
                  <div class="flex justify-center">
                    <Checkbox bind:checked={row.checked} on:change={e=>updateSafetyItem(e, row)} />
                  </div>
                </td>
                {#each columns as {key, ...column}}
                  <td class={cellClasses}>
                    {#if column?.type === 'checkbox'}
                      <div class="flex justify-center">
                        <Checkbox />
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