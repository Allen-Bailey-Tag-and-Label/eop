<script>
  // _imports
  import { serverFetch } from '$lib/_helpers.js';
  import { onMount } from 'svelte'
  
  // components
  import { Button, Buttons, Card, Input, Section, Select, Spinner } from '$components';

  // handler
  const getRoles = async() => {
    const data = await serverFetch('/api/datatable/roles');
    roles = data.rows.map(row=>row.name)
  }
  const submitHandler = async () => {
    modal.spinner.show();
    const user = {
      firstName: body.firstName.value,
      lastName: body.lastName.value,
      email: body.email.value,
      password: 'Ennis01',
      roles: body.roles.value,
    }
    await serverFetch({method:'POST', href:'/api/auth/signup', body: user})
    modal.spinner.hide();
    modal.success.show(`Successfully added user "${body.firstName.value} ${body.lastName.value}"`)
  }

  // props ( internal )
  let body = {
    firstName : { label: 'First Name', value: ''},
    lastName : { label: 'Last Name', value: ''},
    email : { label: 'Email', value: ''},
    roles : { placeholder: 'Select Role(s)', type: 'select', value: [] }
  }
  let loaded = false;
  let roles = [];

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await getRoles();
    loaded = true;
  });
</script>

<svelte:head>
  <title>Add - Manage - Users - Employee Online Portal - Allen Bailey Tag & Label</title>
</svelte:head>

<Section>
  <div class="flex">
    <Buttons.Back />
  </div>
  {#if loaded}
    <form on:submit|preventDefault={submitHandler} class="flex flex-col mt-[24px] space-y-[16px]">
      {#each Object.keys(body) as key}
        {#if !('type' in body[key])}
          <Input placeholder={body[key].label} bind:value={body[key].value} />
        {:else}
          <Select bind:value={body[key].value} multiple={true} placeholder={body[key].placeholder} options={roles} />
        {/if}
      {/each}
      <Button type="submit">Add</Button>
    </form>
  {:else}
    <Card>
      <Spinner />
    </Card>
  {/if}
</Section>