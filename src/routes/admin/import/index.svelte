<script>
  // _imports
  import { onMount } from 'svelte';
  import { serverFetch } from '$lib/_helpers';

  // components
  import { Button, Card, Input, Section, Spinner, Textarea } from '$components';

  // handlers
  const submitHandler = async () => {
    if ( collection.replace(/\s/g, '') !== '' && csv.replace(/\s/g, '') !== '' ) {
      modal.spinner.show();
      const data = await serverFetch({method:'POST',href:`/api/import/${collection}`, body:csv})
      modal.spinner.hide();
      modal.success.show(`Successfully added ${data.length} row${data.length===1 ? '' : 's'} to '${collection}' collection.`);
      collection = '';
      csv = '';
    }
  }

  // props ( external )

  // props ( internal )
  let collection = '';
  let csv = '';
  let loaded = false;

  // props ( dynamic )

  // stores
  import modal from '$components/Modal/store';

  onMount(async() => {
    loaded = true;
  })
</script>

<Section class="space-y-[16px] flex-grow">
  <Card class="space-y-[16px] flex-grow">
    {#if !loaded}
      <Spinner />
    {:else}
      <form on:submit|preventDefault={submitHandler} class="space-y-[16px] flex-grow flex flex-col md:items-start">
        <Input label="Collection" placeholder="Collection" bind:value={collection} />
        <Textarea label="Paste CSV" placeholder="Paste CSV" bind:value={csv} labelClasses="flex-grow md:w-full" />
        <Button type="submit" class="self-end">Submit</Button>
      </form>
    {/if}
  </Card>
</Section>

<!-- <Section class="space-y-[16px]">
  <Card class="items-center space-y-[16px]">
    {#if !loaded}
      <Spinner />
    {:else}
      <div class="flex justify-between w-full items-center space-x-[16px]">
        <Select bind:value={roleId} options={roleOptions} on:change={roleChangeHandler} class="flex-grow-0" />
        <div class="flex justify-end">
          <div class="flex space-x-[8px]">
            {#if roleChanged}
              <div in:grow out:shrink class="flex">
                <Buttons.Icon on:click={saveClickHandler} theme="success"><Icon src={Save} class="w-[24px] h-[24px]"/></Buttons.Icon>
              </div>
            {/if}
            {#if showDelete}
              <div in:grow out:shrink class="flex">
                <Buttons.Icon on:click={deleteClickHandler} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
              </div>
            {/if}
            <Buttons.Icon type="link" href={`./roles/add`}><Icon src={Plus} class="w-[24px] h-[24px]"/></Buttons.Icon>
          </div>
        </div>
      </div>
      {#if roleId !== ''}
        <table class="w-full">
          <thead>
            <th class="{cellClasses} w-[24px]"><Checkbox on:change={checkboxChangeHandler} bind:checked bind:indeterminate /></th>
            {#each columns as {title}}
              <th class="{cellClasses}">{title}</th>
            {/each}
          </thead>
          <tbody>
            {#each rows as row}
              <tr id={row._id}>
                <td class="{cellClasses}"><Checkbox bind:checked={row.checked} /></td>
                {#each columns as {key}}
                  <td class="{cellClasses}">{key in row ? row[key] : ''}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    {/if}
  </Card>
</Section> -->