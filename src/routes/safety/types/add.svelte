<script>
  // _imports
  import { serverFetch } from '$lib/_helpers.js';
  import columns from './_columns';
  
  // components
  import { Button, Buttons, Input, Section, Select } from '$components';

  // handler
  const submitHandler = async () => {
    modal.spinner.show();
    await serverFetch({method:'post', href: '/api/datatable/safety-types', body})
    modal.spinner.hide();
    modal.success.show(`Successfully added safety type "${body.name}"`)
  }

  // props ( internal )
  let body = [...columns].reduce((obj, column)=>{
    obj[column.key] = column.type === 'select' ? column.options[0].value : '';
    return obj;
  }, {})
  $: if ( body.frequency === 'At Hire' ) body.month = '';

  // stores
  import modal from '$components/Modal/store';
</script>

<Section>
  <div class="flex">
    <Buttons.Back />
  </div>
  <form on:submit|preventDefault={submitHandler} class="flex flex-col mt-[24px] space-y-[16px] max-w-[500px] w-full mx-auto">
    {#each columns as {key, title, ...column}}
      {#if 'type' in column}
        {#if (title === 'Month' && body.frequency !== 'At Hire') || title !== 'Month'}
          <Select label={title} options={column.options} bind:value={body[key]} />
        {/if}
      {:else}
        <Input label={title} placeholder={title} bind:value={body[key]} />
      {/if}
    {/each}
    <Button type="submit">Add</Button>
  </form>
</Section>