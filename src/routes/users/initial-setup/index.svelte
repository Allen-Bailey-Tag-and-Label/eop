<script>
  // components
  import { Datatable, Section } from '$components';
  
  // props ( internal )
  const columns = [
    {title:'First Name', key:'firstName'},
    {title:'Last Name', key:'lastName'},
    {title:'Username', key:'username'},
    {title:'Initial Password', key:'initialPassword'}
  ]
  const datatable = {
    collection: 'users',
    columns : [...columns].filter(column=>column.key!=='roles'),
    deleteModalFN : row => `"${row.firstName} ${row.lastName}"`,
    editable: false,
    sort : {
      firstName: 1,
    }
  }
</script>

<Section class="space-y-[16px]">
  <Datatable {...datatable} />
</Section>