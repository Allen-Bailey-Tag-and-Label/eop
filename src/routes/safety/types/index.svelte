<script>
  // _imports
  import columns from './_columns';

  // components
  import { Datatable, Section } from '$components';

  // props ( internal )
  const datatable = {
    collection : 'safety-types',
    columns,
    deleteModalFN : row => `"${row.name}"`,
    editable: true,
    sort : {
      name: 1,
    },
  }
</script>

<Section class="space-y-[16px]">
  <Datatable {...datatable}  />
</Section>