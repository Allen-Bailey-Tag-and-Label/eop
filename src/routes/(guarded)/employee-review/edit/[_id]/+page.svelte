<script>
  import Route from '../../submit/+page.svelte';

  // props (external)
  export let data;
</script>

<Route _id={data._id} {data} title="Employee Review - Edit" userFilterFn={() => true} />
