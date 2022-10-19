<script>
  import Route from '../status-history/+page.svelte';

  // props (external)
  export let data;
</script>

<Route
  columnFilter={() => true}
  {data}
  editable={true}
  filters={[]}
  title="PCR - Status / History - Admin"
/>
