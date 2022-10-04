<script>
  import { page } from '$app/stores';
  import { DBButtonFilter, DBButtonRemove, DBButtonCreate, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let collection = 'routes';
  let columns = [
    { innerHTML: 'Group', key: 'group' },
    { innerHTML: 'Name', key: 'name' },
    { innerHTML: 'HREF', key: 'href' }
  ];
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
        key: 'group'
      }
    };
  }
  $: if ($collections.routes && methods !== undefined) methods.update.rows($collections.routes);
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Admin - Routes</svelte:fragment>
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
