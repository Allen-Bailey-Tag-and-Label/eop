<script>
  import { MongoButtonDelete, MongoButtonInsert, MongoTable, TitleBar } from '$components';

  // utilities

  // handlers

  // props (internal)
  let collection = 'routes';
  let columns = ['group', 'name', 'href'];
  let routes = [];

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
  $: if (data?.routes !== undefined && routes.length === 0) {
    routes = data.routes;
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Routes</svelte:fragment>
    <svelte:fragment slot="right">
      <MongoButtonDelete bind:rows={routes} {collection} />
      <MongoButtonInsert bind:rows={routes} {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={routes} {collection} />
</div>
