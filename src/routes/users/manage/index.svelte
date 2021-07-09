<script>
  // components
  import { Datatable, Section } from '$components';

  // props ( internal )
  const collection = 'users';
  const columns = [
    {title:'First Name', key:'firstName'},
    {title:'Last Name', key:'lastName'},
    {title:'Email', key:'email'},
  ];
  const sort = {
    firstName: 1,
  }
</script>

<svelte:head>
  <title>Manage - Users - Employee Online Portal - Allen Bailey Tag & Label</title>
</svelte:head>

<Section class="space-y-[16px]">
  <Datatable addRoute="/users/manage/add" {collection} {columns} {sort}  />
</Section>