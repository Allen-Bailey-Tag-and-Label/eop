<script>
  // _imports
  import { serverFetch } from '$lib/_helpers.js';
  import { onMount } from 'svelte'
  import columns from './_columns';
  
  // components
  import { Button, Buttons, Card, Input, Section, Select, Spinner } from '$components';

  // handler
  const getRoles = async() => {
    const data = await serverFetch(`/api/datatable/roles?sort=${JSON.stringify({name:1})}`);
    selects.roles = data.rows.map(row=>row.name)
  }
  const submitHandler = async () => {
    modal.spinner.show();
    let user = {
      firstName: body.firstName.value,
      lastName: body.lastName.value,
      username: body.username.value,
      extension: body.extension.value,
      roles: body.roles.value,
    }
    const data = await serverFetch({method:'POST', href:'/api/auth/signup', body: user})
    const { accessToken, password } = data;
    const modalInnerHTML = `Successfully added user "${body.firstName.value} ${body.lastName.value}".  Copy text below to have user verify account.<br><br>Please verify your account with the link below with password <span class="font-bold">${password}</span>:<br><a href="${import.meta.env.VITE_BASE_URL}/users/verify?accessToken=${accessToken}">Verify</a>`
    modal.spinner.hide();
    modal.success.show(modalInnerHTML)
  }

  // props ( internal )
  let body = columns.reduce((obj, column) => {
    obj[column.key] = { label: column.title, value: column.key==='status' ? 'Unverified' : '', ...column}
    return obj;
  }, {})
  let loaded = false;
  let selects = {
    roles: [],
    status : [
      {label: 'Active', value: 'Active'},
      {label: 'Unverified', value: 'Unverified'},
    ]
  }

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await getRoles();
    loaded = true;
  });
</script>

<Section>
  <div class="flex">
    <Buttons.Back />
  </div>
  {#if loaded}
    <form on:submit|preventDefault={submitHandler} class="flex flex-col mt-[24px] space-y-[16px] max-w-[500px] w-full mx-auto">
      {#each Object.keys(body) as key}
        {#if !('type' in body[key])}
          <Input label={body[key].label} placeholder={body[key].label} bind:value={body[key].value} />
        {:else}
          <Select label={body[key].label} bind:value={body[key].value} multiple={body[key].multiple} placeholder={body[key].placeholder} options={selects[key]} />
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