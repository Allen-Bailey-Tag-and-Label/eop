<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let collection = 'ups-quotes';
  let columns = [
    { innerHTML: 'Quote #', key: 'quote' },
    { innerHTML: 'Created Date', key: 'date', type: 'datetime' },
    { innerHTML: 'Address', key: 'shipTo.AddressLine' },
    { innerHTML: 'City', key: 'shipTo.City' },
    { innerHTML: 'State', key: 'shipTo.StateProvinceCode' },
    { innerHTML: 'ZIP', key: 'shipTo.PostalCode' },
    {
      innerHTML: 'Classification',
      key: 'classification',
      options: [
        { label: 'Commercial', value: 'Commercial' },
        { label: 'Residential', value: 'Residential' },
        { label: 'Unclassified', value: 'Unclassified' }
      ],
      type: 'select'
    },
    {
      clickHandler: ({ row: { quote } }) => {
        goto(`/ups/quote-history/${quote}`);
      },
      innerHTML: 'View',
      type: 'button'
    },
    {
      clickHandler: ({ row }) => {
        $routeStates['/ups/new-quote'] = {
          PackageInfo: row.packageInfo,
          Shipper: row.shipper,
          ShipTo: row.shipTo
        };
        goto('/ups/new-quote');
      },
      innerHTML: 'Duplicate',
      type: 'button'
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
        key: 'quote'
      }
    };
  }

  // props (external)

  // props (dynamic)
  $: if ($collections[collection] && methods !== undefined)
    methods.update.rows($collections[collection]);

  // lifecycle
  onMount(() => {
    if (methods?.sort?.rows) methods.sort.rows();
  });
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">UPS - Quote History</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonRemove bind:rows={$routeStates[$page.url.pathname].rows} {collection} />
      <DBButtonFilter bind:filters={$routeStates[$page.url.pathname].filters} {columns} />
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
