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
  
  // components
  import { Button, Buttons, Card, Input, Section, Select, Spinner } from '$components';

  // handler
  const getRoute = async () => {
    const data = await serverFetch(`/api/datatable/safety-types?_id=${query._id}`);
    Object.keys(body).forEach(key=>{
      body[key] = key in data.rows[0] ? data.rows[0][key] : ''
    })
  }
  const submitHandler = async () => {
    modal.spinner.show();
    await serverFetch({method:'PATCH', href: `/api/datatable/safety-types?_id=${query._id}`, body})
    modal.spinner.hide();
    modal.success.show(`Successfully updated route "${body.name}"`)
  }

  // props ( internal )
  let body = [...columns].reduce((obj, column)=>{
    obj[column.key] = column.type === 'select' ? column.options[0].value : '';
    return obj;
  }, {})
  let loaded = false;

  // props ( external )
  export let query;

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    await Promise.all([
      getRoute(),
    ]);
    loaded = true;
  });
</script>

<Section>
  <div class="flex">
    <Buttons.Back />
  </div>
  {#if loaded}
    <form on:submit|preventDefault={submitHandler} class="flex flex-col mt-[24px] space-y-[16px]">
      {#each columns as {key, ...column}}
        {#if 'type' in column}
          <Select label={key} options={column.options} bind:value={body[key]} />
        {:else}
          <Input label={key} placeholder={key} bind:value={body[key]} />
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