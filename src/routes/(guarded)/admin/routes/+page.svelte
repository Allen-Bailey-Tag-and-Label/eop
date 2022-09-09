<script>
  import {
    MongoButtonRemove,
    MongoButtonCreate,
    MongoSocketRegistration,
    MongoTable,
    TitleBar
  } from '$components';
  import store from './store';

  // utilities

  // handlers

  // props (internal)
  let collection = 'routes';
  let columns = ['group', 'name', 'href'];

  // props (external)
  export let data;
  export let errors;

  // props (dynamic)
  $: if (data?.routes !== undefined && $store.data.routes.length === 0) {
    $store.data.routes = data.routes;
  }
</script>

<MongoSocketRegistration bind:store={$store} />

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Routes</svelte:fragment>
    <svelte:fragment slot="right">
      <MongoButtonRemove bind:rows={$store.data.routes} {collection} />
      <MongoButtonCreate bind:rows={$store.data.routes} {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={$store.data.routes} {collection} />
</div>
