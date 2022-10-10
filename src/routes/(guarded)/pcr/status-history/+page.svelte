<script>
  import { page } from '$app/stores';
  import { DBButtonCreate, DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';
  import TDUserPopulate from './TDUserPopulate.svelte';

  // utilities

  // handlers

  // props (internal)
  let collection = 'pay-change-requests';
  let columns = [
    { component: TDUserPopulate, innerHTML: 'First', key: 'user', populateField: 'firstName' },
    { component: TDUserPopulate, innerHTML: 'Last', key: 'user', populateField: 'lastName' },
    { innerHTML: 'Date', key: 'change.date', type: 'date' },
    {
      innerHTML: 'Status',
      key: 'status',
      options: [
        { label: 'Approved', value: 'Approved' },
        { label: 'Submitted', value: 'Submitted' }
      ],
      type: 'select'
    }
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
        direction: -1,
        key: 'change.date'
      }
    };
  }

  // props (external)

  // props (dynamic)
  $: if ($collections[collection] && methods !== undefined)
    methods.update.rows($collections[collection]);
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">PCR - Status History</svelte:fragment>
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
    editable={false}
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>
