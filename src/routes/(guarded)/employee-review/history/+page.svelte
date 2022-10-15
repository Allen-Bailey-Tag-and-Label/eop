<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';
  import Options from './Options.svelte';

  // utilities

  // handlers

  // props (internal)
  let collection = 'employee-reviews';
  let columns = [
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
      innerHTML: 'Date',
      key: 'date',
      type: 'date'
    },
    {
      formula: `
        return Object.values(obj.row.ratings).reduce((total, value) => total + value, 0);
      `,
      innerHTML: 'Score',
      key: 'score',
      type: 'formula'
    },
    {
      formula: `
        return Object.keys(obj.row.ratings).length * 9;
      `,
      innerHTML: 'Total',
      key: 'total',
      type: 'formula'
    },
    {
      component: Options,
      innerHTML: 'Options',
      key: 'edit'
    }
  ];
  let methods = undefined;

  // props (external)
  export let data;
  export let editable = true;
  export let filters = [
    { field: 'evaluator', operator: 'is', value: [data?.user?._id, ''], visible: false }
  ];
  export let title = 'Employee Review - History';

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
        key: 'date'
      }
    };
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
