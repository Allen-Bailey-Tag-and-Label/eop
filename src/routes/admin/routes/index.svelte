<script>
  // components
  import { Datatable, Section } from '$components';

  // props ( internal )
  const collection = 'routes';
  const columns = [
    {title:'Group', key:'group'},
    {title:'Name', key:'name'},
    {title:'Route', key:'href'},
  ];
  const sort = {
    group: 1,
    name: 1,
  }
</script>

<svelte:head>
  <title>Routes - Admin - Employee Online Portal - Allen Bailey Tag & Label</title>
</svelte:head>

<Section class="space-y-[16px]">
  <Datatable {collection} {columns} {sort}  />
</Section>