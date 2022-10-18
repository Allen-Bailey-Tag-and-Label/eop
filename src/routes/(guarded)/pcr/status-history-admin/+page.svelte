<script>
  import Route from '../status-history/+page.svelte';

  // props (external)
  export let data;
</script>

<Route {data} editable={true} filters={[]} title="PCR - Status / History - Admin" />
