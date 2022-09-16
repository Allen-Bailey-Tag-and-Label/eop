<script>
  import { MongoButtonRemove, MongoButtonCreate, MongoTable, TitleBar } from '$components';
  import { collections } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let collection = 'routes';
  let columns = [
    { innerHTML: 'Group', key: 'group' },
    { innerHTML: 'Name', key: 'name' },
    { innerHTML: 'HREF', key: 'href' }
  ];

  // props (external)
  export let data;
  export let errors;
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Routes</svelte:fragment>
    <svelte:fragment slot="right">
      <MongoButtonRemove bind:rows={$collections.routes} {collection} />
      <MongoButtonCreate {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <MongoTable bind:columns bind:rows={$collections.routes} {collection} />
</div>
