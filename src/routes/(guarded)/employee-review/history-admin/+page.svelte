<script>
  import Route from '../history/+page.svelte';

  // props (external)
  export let data;
</script>

<Route {data} filters={[]} title="Employee Review - History (Admin)" />
