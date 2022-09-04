<script>
  import { Header } from 'sveltewind/components';
  import { Nav } from '$components';

  // utilities

  // handlers

  // props (internal)

  // props (external)
  export let routes;

  // props (dynamic)
</script>

<Header>
  <Nav {routes} />
</Header>
