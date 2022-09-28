<script>
  import { page } from '$app/stores';
  import { DBButtonFilter, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let columns = [
    { innerHTML: 'First', key: 'firstName' },
    { innerHTML: 'Last', key: 'lastName' },
    { innerHTML: 'Email', key: 'email' },
    { innerHTML: 'Extension', key: 'extension', mask: 'extension' }
  ];

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters: [{ field: 'status', operator: 'is', value: ['Active', ''], visible: false }],
      rows: [],
      sort: {
        direction: 1,
        key: 'firstName'
      }
    };
  }

  $: if ($collections.users) {
    $routeStates[$page.url.pathname].rows = $collections.users;
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Users - Directory</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonFilter bind:filters={$routeStates[$page.url.pathname].filters} {columns} />
    </svelte:fragment>
  </TitleBar>
  <DBTable
    bind:columns
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    editable={false}
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>
