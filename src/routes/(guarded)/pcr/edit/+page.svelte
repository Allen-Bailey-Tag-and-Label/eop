<script>
  import Route from '../submit/+page.svelte';

  // props (external)
  export let data;
</script>

<Route {data} title="PCR - Edit" userFilterFn={({ user }) => user._id !== data.user._id} />
