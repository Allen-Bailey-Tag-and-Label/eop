<script context="module">
  export async function load({ page }) {
    // destructure page
    let { query } = page;

    // sanitize query
    query = Object.fromEntries(query);
    
    return {
      props : {
        query
      }
    }
  }
</script>
<script>
  // _imports
  import { serverFetch } from '$lib/_helpers.js';
  import { onMount } from 'svelte'
  import columns from './_columns';
  import moment from 'moment'
  
  // components
  import { Button, Buttons, Card, Input, Section, Select, Spinner } from '$components';

  // handler
  const getRoles = async() => {
    const data = await serverFetch(`/api/datatable/roles?sort=${JSON.stringify({name:1})}`);
    selects.roles = data.rows.map(row=>row.name)
  }
  const getUser = async() => {
    const data = await serverFetch(`/api/datatable/users?_id=${query._id}`);

    Object.keys(body).forEach(key=>{
      body[key].value = data.rows[0][key]
      if ( body[key]?.type === 'date' ) body[key].value = moment(body[key].value, 'x').format('MM.DD.YYYY')
    });
  }
  const submitHandler = async () => {
    modal.spinner.show();
    const user = Object.keys(body).reduce((obj, key)=>{
      obj[key] = body[key].value;
      if ( body[key]?.type === 'date' ) obj[key] = moment(obj[key], 'MM.DD.YYYY').format('x')
      return obj;
    }, {})
    await serverFetch({method:'PATCH', href:`/api/datatable/users?_id=${query._id}`, body: user})
    modal.spinner.hide();
    modal.success.show(`Successfully updated user "${body.firstName.value} ${body.lastName.value}"`)
  }

  // props ( internal )
  let body = columns.reduce((obj, column) => {
    obj[column.key] = { label: column.title, value: '', ...column}
    return obj;
  }, {})
  let loaded = false;
  let selects = {
    roles : [],
    status : [
      {label: 'Active', value: 'Active'},
    ]
  }

  // props ( external )
  export let query;

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await Promise.all([
      getRoles(),
      getUser()
    ]);
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
        {#if ('type' in body[key])}
          {#if body[key].type === 'date'}
            <Input label={body[key].label} placeholder={body[key].label} bind:value={body[key].value} type="date" />
          {:else}
            <Select label={body[key].label} bind:value={body[key].value} multiple={body[key].multiple} placeholder={body[key].placeholder} options={selects[key]} />
          {/if}
        {:else}
          <Input label={body[key].label} placeholder={body[key].label} bind:value={body[key].value} />
        {/if}
      {/each}
      <Button type="submit">Save</Button>
    </form>
  {:else}
    <Card>
      <Spinner />
    </Card>
  {/if}
</Section>