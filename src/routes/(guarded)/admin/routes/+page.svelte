<script>
  import { Button, Icon, MongoModalInsert, MongoTable, TitleBar } from '$components';
  import { Plus, Trash } from '$icons';
  import { theme } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let collection = 'routes';
  let columns = ['group', 'name', 'href'];
  let routes = [];
  let show = false;
  let toggleModal;

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
  $: if (data?.routes !== undefined && routes.length === 0) {
    routes = data.routes;
  }
  $: selectedRows = [...routes].filter((route) => route?._mongoTable?.selected);
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Routes</svelte:fragment>
    <svelte:fragment slot="right">
      {#if selectedRows.length > 0}
        <Button
          class="{$theme.buttonIcon} bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:ring-red-500/[.3]"
        >
          <Icon src={Trash} />
        </Button>
      {/if}
      <Button class={$theme.buttonIcon} on:click={toggleModal}>
        <Icon src={Plus} />
      </Button>
    </svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={routes} {collection} />
</div>
<MongoModalInsert bind:columns bind:rows={routes} bind:show bind:toggleModal {collection} />
