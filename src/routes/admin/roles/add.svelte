<script>
  // _imports
  import { serverFetch } from '$lib/_helpers.js';
  
  // components
  import { Button, Buttons, Input, Section } from '$components';

  // handler
  const submitHandler = async () => {
    modal.spinner.show();
    const data = await serverFetch('/api/datatable/routes?name=Dashboard');
    await serverFetch({method:'POST', href:'/api/datatable/roles', body: {name: body.name, routes:data.rows}})
    modal.spinner.hide();
    modal.success.show(`Successfully added role "${body.name}"`)
  }

  // props ( internal )
  let body = {
    name : ''
  }

  // stores
  import modal from '$components/Modal/store';
</script>

<Section>
  <div class="flex">
    <Buttons.Back />
  </div>
  <form on:submit|preventDefault={submitHandler} class="flex flex-col mt-[24px] space-y-[16px] max-w-[500px] w-full mx-auto">
    {#each Object.keys(body) as key}
      <Input label={key} placeholder={key} bind:value={body[key]} />
    {/each}
    <Button type="submit">Add</Button>
  </form>
</Section>