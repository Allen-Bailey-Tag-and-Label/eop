<script>
  import { page } from '$app/stores';
  import { DBButtonCreate, DBButtonFilter, DBButtonRemove, DBTable, TitleBar } from '$components';
  import { collections, routeStates } from '$stores';

  // utilities

  // handlers

  // props (internal)
  let columns = [];
  let filters = [];
  let methods = undefined;
  let pagination = {
    length: undefined,
    page: undefined
  };
  let rows = [];
  let sort = {
    index: 0
  };

  // props (external)
  export let data;

  if (routeStates?.[$page.url.pathname] === undefined) {
    routeStates[$page.url.pathname] = {};
  }

  // props (dynamic)
  $: collectionDoc = $collections?.['quick-collections']?.find(
    ({ href }) => href === data.collection
  );
  $: if (columns.length === 0 && collectionDoc) {
    columns = collectionDoc.columns.map((column) => {
      if (column.type === 'select' && column?.collection) {
        column.options = $collections[column.collection]
          .map((doc) => {
            return {
              label: column.template.replace(/(\[(.*?)\])/g, (match) => {
                const key = match.slice(1, match.length - 1);
                return doc[key];
              }),
              value: doc._id
            };
          })
          .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
        delete column.collection;
        delete column.template;
      }
      return column;
    });
  }
  $: if ($collections?.[collectionDoc?.href] && collectionDoc && methods !== undefined)
    methods.update.rows($collections[collectionDoc.href]);

  $: collection = collectionDoc ? collectionDoc.href : '';
  $: title = collectionDoc ? `Collections - ${collectionDoc.name}` : '';
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">{title}</svelte:fragment>
    <svelte:fragment slot="right">
      <DBButtonRemove bind:rows {collection} />
      <DBButtonFilter bind:filters {columns} />
      <DBButtonCreate {collection} {columns} />
    </svelte:fragment>
  </TitleBar>
  <DBTable bind:columns bind:methods bind:pagination bind:rows bind:sort {collection} {filters} />
</div>
