<script>
  // _imports
  import columns from '../management/_columns';

  // components
  import { Datatable, Section } from '$components';
  
  // props ( internal )
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