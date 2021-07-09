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
  
  // components
  import { Button, Buttons, Card, Input, Section, Spinner } from '$components';

  // handler
  const getRoute = async () => {
    const data = await serverFetch(`/api/datatable/routes?_id=${query._id}`);
    
    delete data.rows[0]._id
    body = data.rows[0]
  }
  const submitHandler = async () => {
    modal.spinner.show();
    const data = {
      name: body.name,
      href: body.href
    }
    if ( body.group !== '' ) data.group = body.group
    await serverFetch({method:'PATCH', href: `/api/datatable/routes?_id=${query._id}`, body: data})
    modal.spinner.hide();
    modal.success.show(`Successfully updated route "${body.name}"`)
  }

  // props ( internal )
  let body = {
    group : '',
    name : '',
    href : '',
  }
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
      {#each Object.keys(body) as key}
        <Input placeholder={key} bind:value={body[key]} />
      {/each}
      <Button type="submit">Save</Button>
    </form>
  {:else}
    <Card>
      <Spinner />
    </Card>
  {/if}
</Section>