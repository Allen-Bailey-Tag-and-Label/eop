<script>
  import { page } from '$app/stores';
  import { DBButtonCreate, DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let columns = [];
  let filters = [];
  let pagination = {
    length: undefined,
    page: undefined
  };
  let rows = [];
  let sort = {
    index: 0
  };

  // props (external)
  export let data;

  if (routeStates?.[$page.url.pathname] === undefined) {
    routeStates[$page.url.pathname] = {};
  }

  // props (dynamic)
  $: collectionDoc = $collections?.['quick-collections']?.find(
    ({ href }) => href === data.collection
  );
  $: if (columns.length === 0 && collectionDoc) {
    columns = collectionDoc.columns;
  }
  $: if ($collections?.[collectionDoc?.href] && collectionDoc) {
    rows = $collections[collectionDoc.href];
  }
  $: collection = collectionDoc ? collectionDoc.href : '';
  $: title = collectionDoc ? `Collections - ${collectionDoc.name}` : '';
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">{title}</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonRemove bind:rows {collection} />
      <DBButtonFilter bind:filters {columns} />
      <DBButtonCreate {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <DBTable bind:columns bind:pagination bind:rows bind:sort {collection} {filters} />
</div>
