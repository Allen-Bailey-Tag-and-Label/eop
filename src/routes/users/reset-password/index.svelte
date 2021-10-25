<script>
  // _imports
  import { onMount } from 'svelte';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js'
  import { grow, shrink } from '$lib/_transitions';
  import auth from "$lib/auth";
  import { getUsers } from '$lib/user';
  import moment from 'moment';
  import modal from '$components/Modal/store';

  // components
  import { Buttons, Card, Checkbox, Input, Section, Select, Spinner, Table } from '$components';
  import Icon, { Refresh } from 'svelte-hero-icons';

  // handlers
  const resetClickHandler = async () => {
    const resetUsers = [...tableRows].filter(row=>row.checked);
    const confirmFn = async () => {
      modal.spinner.show();
      await Promise.all(resetUsers.map(async ({_id}) => {
        await serverFetch({method : 'POST', href: '/api/auth/resetpassword', body: {_id}});
      }))
      modal.spinner.hide()
      modal.success.show(`Successfully reset password of user${resetUsers.length===1?'':'s'}:<br> ${[...resetUsers].map(user=>`${user.firstName} ${user.lastName}`).join(', ')}.`);
    }
    modal.confirmation.show(`Reset the password of user${resetUsers.length===1?'':'s'}:<br> ${[...resetUsers].map(user=>`${user.firstName} ${user.lastName}`).join(', ')}.`, confirmFn)
  }

  // props ( internal )
  const cellClasses = 'p-[10px]';
  let loaded = false;
  let tableRows = [];
  let users = [];

  // props ( dynamic )
  $: showResetButton = [...tableRows].filter(row=>row.checked).length > 0;

  onMount(async()=>{
    users = await getUsers();
    tableRows = [...users].map(user => {
      user.checked = false;
      return user;
    })
    loaded = true
  })
</script>

<Section>
  <Card class="items-center space-y-[2rem]">
    {#if loaded}
      <div class="w-full flex justify-end min-h-[2.25rem]">
        {#if showResetButton}
          <div in:grow out:shrink class="flex">
            <Buttons.Icon on:click={resetClickHandler} theme="secondary"><Icon src={Refresh} class="w-[24px] h-[24px]"/></Buttons.Icon>
          </div>
        {/if}
      </div>
      <Table width="">
        <thead slot="thead">
          <th class="{cellClasses}"></th>
          <th class="{cellClasses}">First</th>
          <th class="{cellClasses}">Last</th>
        </thead>
        <tbody slot="tbody">
          {#each tableRows as {checked, firstName, lastName, _id}}
            <tr class="rounded transition duration-200 bg-white bg-opacity-0 hover:bg-opacity-[2%]">
              <td class="{cellClasses}"><Checkbox bind:checked/></td>
              <td class="{cellClasses}">{firstName}</td>
              <td class="{cellClasses}">{lastName}</td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {:else}
      <Spinner />
    {/if}
  </Card>
</Section>