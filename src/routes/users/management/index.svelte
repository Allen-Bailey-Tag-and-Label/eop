<script>
  // _imports
  import columns from './_columns';

  // components
  import { Datatable, Section } from '$components';
  
  // props ( internal )
  const datatable = {
    collection: 'users',
    columns,
    deleteModalFN : row => `"${row.firstName} ${row.lastName}"`,
    editable: true,
    sort : {
      firstName: 1,
    }
  }
</script>

<Section class="space-y-[16px]">
  <Datatable {...datatable} />
</Section>