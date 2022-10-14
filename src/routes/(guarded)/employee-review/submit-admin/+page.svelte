<script>
  import Route from '../submit/+page.svelte';

  // props (external)
  export let data;
</script>

<Route {data} title="Employee Review - Submit (Admin)" userFilterFn={() => true} />
