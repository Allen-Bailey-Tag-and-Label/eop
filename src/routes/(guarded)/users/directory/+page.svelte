<script>
  import { page } from '$app/stores';
  import { MongoTable, TitleBar } from '$components';
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

  // props (external)
  export let data;
  export let errors;

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
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
  </TitleBar>
  <MongoTable
    bind:columns
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    editable={false}
  />
</div>
