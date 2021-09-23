<script>
  // _imports
  // import { page } from '$app/stores';
  import { serverFetch } from "$lib/_helpers.js";
  import { grow, shrink } from "$lib/_transitions.js";
  // import auth from '$lib/auth';
  // import moment from 'moment';
  import { onMount } from "svelte";

  // components
  import { Buttons, Card, Checkbox, Section, Select, Spinner, Table } from "$components";
  import Icon, {Save} from 'svelte-hero-icons';

  // handlers
  const employeeChangeHandler = async () => {
    modal.spinner.show();
    headerCheckbox = {
      checked: false,
      indeterminate: false,
    }
    if ( userId !== '' ) {
      const { rows } = await serverFetch(`/api/datatable/direct-reports?userId=${userId}`);
      if ( rows.length > 0 ) {
        method = 'PATCH'
        href = `/api/datatable/direct-reports?userId=${userId}`
        availableUsers = [...users].filter(user=>user._id !== userId).map(({_id, firstName, lastName})=>{
          return { 
            _id, firstName, lastName, checked: rows[0].userIds.includes(_id)
          }
        });
        currentUsers = [...rows[0].userIds]
      } else {
        method = 'POST';
        href = '/api/datatable/direct-reports';
        availableUsers = [...users].filter(user=>user._id !== userId).map(({_id, firstName, lastName})=>{
          return { 
            _id, firstName, lastName, checked: false
          }
        });
        currentUsers = [];
      }
    } else {
      availableUsers = [];
    }
    modal.spinner.hide();
  }
  const getUsers = async () => {
    const { rows } = await serverFetch(
      `/api/datatable/users?sort=${JSON.stringify({
        firstName: 1,
        lastName: 1,
      })}`
    );
    users = rows;
  };
  const headCheckboxChangeHandler = e => availableUsers = e.target.checked ? availableUsers.map(user=>{user.checked = true; return user}) :
                                                                             availableUsers.map(user=>{user.checked = false; return user});
  const saveHandler = async () => {
    modal.spinner.show();
    const body = {
      userId,
      userIds : checkedUsers
    };
    await serverFetch({
      method,
      href,
      body
    });
    currentUsers = [...checkedUsers];
    modal.spinner.hide();
  }

  // props ( internal )
  let availableUsers = [];
  let cellClasses = 'p-[10px]';
  let currentUsers = [];
  let headerCheckbox = {
    checked: false,
    indeterminate: false,
  }
  let href = '';
  let loaded = false;
  let method = 'POST';
  let userId = "";
  let users = [];

  // props ( external )

  // props ( dynamic )
  $: checkedUsers = [...availableUsers].filter(({checked})=>checked).map(({_id}) => _id);
  $: modified = JSON.stringify(currentUsers) !== JSON.stringify(checkedUsers)
  $: userOptions = [{label:'-- Select an Employee', value:''}, ...[...users].map((user) => {
    return { label: `${user.firstName} ${user.lastName}`, value: user._id };
  })];
  $: if ( checkedUsers.length === availableUsers.length ) {
    headerCheckbox = { checked : true, indeterminate: false};
  } else if ( checkedUsers.length === 0 ) {
    headerCheckbox = { checked : false, indeterminate: false};
  } else {
    headerCheckbox = { checked : false, indeterminate: true};
  }

  // stores
  import { modal } from '$stores';

  // lifecycles
  onMount(async () => {
    await getUsers();
    loaded = true;
  });
</script>

<Section>
  {#if loaded}
    <Card>
      <div class="flex flex-col space-y-[1rem] items-start">
        <div class="flex justify-between w-full">
          <Select on:change={employeeChangeHandler} label="Employee" bind:options={userOptions} bind:value={userId} />
          <div class="flex space-x-[8px] items-start">
            {#if modified}
              <div class="flex items-start" in:grow out:shrink>
                <Buttons.Icon on:click={saveHandler} theme="success"><Icon src={Save} class="w-[24px] h-[24px]"/></Buttons.Icon>
              </div>
            {/if}
          </div>
        </div>
        {#if availableUsers.length > 0}
          <Table width="">
            <thead slot="thead">
              <th class="{cellClasses} w-[24px]"><Checkbox on:change={headCheckboxChangeHandler} bind:checked={headerCheckbox.checked} bind:indeterminate={headerCheckbox.indeterminate} /></th>
              <th class="{cellClasses}">First Name</th>
              <th class="{cellClasses}">Last Name</th>
            </thead>
            <tbody slot="tbody">
              {#each availableUsers as {firstName, lastName, checked}}
                <tr>
                  <td class="{cellClasses}"><Checkbox bind:checked/></td>
                  <td class="{cellClasses}">{firstName}</td>
                  <td class="{cellClasses}">{lastName}</td>
                </tr>
              {/each}
            </tbody>
          </Table>
        {/if}
      </div>
    </Card>
  {:else}
    <div class="h-full min-h-full flex items-center justify-center">
      <Card>
        <Spinner />
      </Card>
    </div>
  {/if}
</Section>
