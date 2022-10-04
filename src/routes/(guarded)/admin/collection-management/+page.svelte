<script>
  import { page } from '$app/stores';
  import { DBButtonCreate, DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  const collection = 'collections';
  let columns = [{ innerHTML: 'Name', key: 'name' }];
  let methods = undefined;

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters: [],
      pagination: {
        length: undefined,
        page: undefined
      },
      rows: [],
      sort: {
        direction: 1,
        key: 'name'
      }
    };
  }

  $: if ($collections.collections && methods !== undefined)
    methods.update.rows($collections.collections);
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
    bind:methods
    bind:pagination={$routeStates[$page.url.pathname].pagination}
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    {collection}
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>
