<script>
  import { page } from '$app/stores';
  import { DBButtonCreate, DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  const collection = 'users';
  let columns = [{ innerHTML: 'Name', key: 'name' }];

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters: [],
      rows: [],
      sort: {
        direction: 1,
        key: 'name'
      }
    };
  }

  $: if ($collections.collections) {
    $routeStates[$page.url.pathname].rows = $collections.collections;
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Collection Management</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonRemove bind:rows={$routeStates[$page.url.pathname].rows} {collection} />
      <DBButtonFilter bind:filters={$routeStates[$page.url.pathname].filters} {columns} />
      <DBButtonCreate {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <DBTable
    bind:columns
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    collection="collections"
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>
