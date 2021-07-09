<script>
  // components
  import { Datatable, Section } from '$components';

  // props ( internal )
  const datatable = {
    collection : 'routes',
    columns : [
      {title:'Group', key:'group'},
      {title:'Name', key:'name'},
      {title:'Route', key:'href'},
    ],
    editable: true,
    sort : {
      group: 1,
      name: 1,
    },
  }
</script>

<Section class="space-y-[16px]">
  <Datatable {...datatable}  />
</Section>