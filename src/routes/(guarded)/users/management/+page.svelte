<script>
  import { page } from '$app/stores';
  import { DBButtonCreate, DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  const collection = 'users';
  let columns = [];
  let methods = undefined;

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters: [{ field: 'status', operator: 'is', value: ['Active', ''] }],
      pagination: {
        length: undefined,
        page: undefined
      },
      rows: [],
      sort: {
        direction: 1,
        key: 'firstName'
      }
    };
  }
  $: if ($collections.departments) {
    columns = [
      { innerHTML: 'First', key: 'firstName' },
      { innerHTML: 'Last', key: 'lastName' },
      {
        innerHTML: 'Department',
        key: 'department',
        options: [...$collections.departments]
          .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
          .map(({ _id, name }) => {
            return { label: name, value: _id };
          }),
        type: 'select'
      },
      { innerHTML: 'Email', key: 'email' },
      { innerHTML: 'Ennis ID', key: 'ennisId' },
      { innerHTML: 'Exempt', key: 'exempt', type: 'checkbox' },
      { innerHTML: 'Extension', key: 'extension', mask: 'extension' },
      { innerHTML: 'Hire Date', key: 'hireDate', type: 'date' },
      {
        innerHTML: 'Status',
        key: 'status',
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
          { label: 'Unverified', value: 'Unverified' }
        ],
        type: 'select'
      },
      { innerHTML: 'Supervisor', key: 'supervisor', type: 'checkbox' }
    ];
  }
  $: if ($collections.users && methods !== undefined) {
    methods.update.rows($collections.users);
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">Users - Management</svelte:fragment>
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
    collection="users"
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>
