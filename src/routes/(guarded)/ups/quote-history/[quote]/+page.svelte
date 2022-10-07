<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button, Table, Tbody, Td, Tr, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  const { format: currencyFormat } = new Intl.NumberFormat('en-us', {
    style: 'currency',
    currency: 'USD'
  });

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      filters: [],
      pagination: {
        length: undefined,
        page: undefined
      },
      rows: [],
      sort: undefined
    };
  }

  // props (external)
  export let data;
  $: doc = $collections?.['ups-quotes']?.find(({ quote }) => +quote === +data?.quote);
  $: ({ classification, date, packageInfo, quote, rates = [], shipper, shipTo } = doc || {});

  // props (dynamic)
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">UPS - Quote #{quote}</svelte:fragment>
  </TitleBar>
  <div
    class="flex flex-col p-[2rem] overflow-auto space-y-[1rem] lg:flex-grow lg:items-center lg:justify-center"
  >
    <div class="grid grid-cols-[auto_auto] gap-x-[1rem] gap-y-[.5rem]">
      <div class="font-bold">Quote:</div>
      <div>{quote}</div>
      <div class="font-bold">Date:</div>
      <div>
        {new Date(date).toLocaleDateString()}
        {new Date(date).toLocaleTimeString()}
      </div>
      <div class="font-bold">Ship From:</div>
      <div>
        {shipper?.AddressLine}
        {shipper?.City}, {shipper?.StateProvinceCode}
        {shipper?.PostalCode}
      </div>
      <div class="font-bold">Ship To:</div>
      <div>
        {shipTo?.AddressLine}
        {shipTo?.City}, {shipTo?.StateProvinceCode}
        {shipTo?.PostalCode}
      </div>
      <div class="font-bold">Classification:</div>
      <div>{classification}</div>
      <div class="font-bold">Total Packages:</div>
      <div>{packageInfo?.Packages}</div>
      <div class="font-bold">Total Weight:</div>
      <div>{packageInfo?.Weight}</div>
      <Table class="col-span-2 lg:w-auto">
        <Tbody>
          {#each rates as { description, rate }}
            <Tr>
              <Td>{description}</Td>
              <Td class="text-right">{currencyFormat(rate)}</Td>
            </Tr>
          {/each}
        </Tbody>
      </Table>
      <div class="flex justify-end col-span-2">
        <Button
          on:click={() => {
            $routeStates['/ups/new-quote'] = {
              PackageInfo: packageInfo,
              Shipper: shipper,
              ShipTo: shipTo
            };
            goto('/ups/new-quote');
          }}
        >
          Duplicate
        </Button>
      </div>
    </div>
  </div>
</div>
