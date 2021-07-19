<script>
  // _imports
  import { serverFetch } from '$lib/_helpers.js';
  
  // components
  import { Button, Buttons, Input, Section } from '$components';

  // handler
  const submitHandler = async () => {
    modal.spinner.show();
    const data = {
      name: body.name,
      href: body.href
    }
    if ( body.group !== '' ) data.group = body.group
    await serverFetch({method:'post', href: '/api/datatable/routes', body: data})
    modal.spinner.hide();
    modal.success.show(`Successfully added route "${body.name}"`)
  }

  // props ( internal )
  let body = {
    group : '',
    name : '',
    href : '',
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