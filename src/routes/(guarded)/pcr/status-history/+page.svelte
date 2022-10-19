<script>
  import { page } from '$app/stores';
  import { DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';
  import Options from './Options.svelte';

  // utilities

  // handlers

  // props (internal)
  let collection = 'pay-change-requests';
  let columns = [];
  let methods = undefined;

  // props (external)
  export let columnFilter = (column) => column.key !== 'requestedBy';
  export let data;
  export let editable = false;
  export let filters = [
    { field: 'requestedBy', operator: 'is', value: [data?.user?._id, ''], visible: false }
  ];
  export let title = 'PCR - Status / History';

  // props (dynamic)
  $: if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters,
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
  $: if ($collections.users) {
    columns = [
      {
        collection: 'users',
        innerHTML: 'First',
        key: 'user',
        populateField: 'firstName',
        type: 'collection-populate'
      },
      {
        collection: 'users',
        innerHTML: 'Last',
        key: 'user',
        populateField: 'lastName',
        type: 'collection-populate'
      },
      {
        innerHTML: 'Requested By',
        key: 'requestedBy',
        options: [
          { label: '', value: '' },
          ...[...$collections.users]
            .map((user) => {
              return { label: `${user.firstName} ${user.lastName}`, value: user._id };
            })
            .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))
        ],
        type: 'select'
      },
      { innerHTML: 'Date', key: 'change.date', type: 'date' },
      {
        innerHTML: 'Status',
        key: 'status',
        options: [
          { label: 'Approved', value: 'Approved' },
          { label: 'Submitted', value: 'Submitted' }
        ],
        type: 'select'
      },
      {
        component: Options,
        innerHTML: 'Options',
        key: 'options'
      }
    ];
    columns = columns.filter(columnFilter);
  }
  $: if ($collections[collection] && methods !== undefined)
    methods.update.rows($collections[collection]);
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">{title}</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonRemove bind:rows={$routeStates[$page.url.pathname].rows} {collection} />
      <DBButtonFilter bind:filters={$routeStates[$page.url.pathname].filters} {columns} />
      <!-- <DBButtonCreate {collection} {columns} /> -->
    </svelte:fragment>
  </TitleBar>
  <DBTable
    bind:columns
    bind:methods
    bind:pagination={$routeStates[$page.url.pathname].pagination}
    bind:rows={$routeStates[$page.url.pathname].rows}
    bind:sort={$routeStates[$page.url.pathname].sort}
    {collection}
    {editable}
    filters={$routeStates[$page.url.pathname].filters}
  />
</div>
