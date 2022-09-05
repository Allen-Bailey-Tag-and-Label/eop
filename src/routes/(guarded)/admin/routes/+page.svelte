<script>
  import { MongoButtonDelete, MongoButtonInsert, MongoTable, TitleBar } from '$components';
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
  $: if (data?.routes !== undefined && $store.rows.length === 0) {
    $store.rows = data.routes;
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Routes</svelte:fragment>
    <svelte:fragment slot="right">
      <MongoButtonDelete bind:rows={$store.rows} {collection} />
      <MongoButtonInsert bind:rows={$store.rows} {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={$store.rows} {collection} />
</div>
