<script context="module">
  export function load({ page }) {    
    return {
      props: {
        path: page.path
      }
    }
  }
</script>
<script>
  // _imports
  import { goto } from '$app/navigation';
  import { beforeUpdate, onMount } from 'svelte';
  import auth, { getRoutes } from '$lib/auth';

  // components
  import { Card, Modal, Sidebar, Spinner } from '$components'

  // css
  import '$css/style.css';

  // props ( internal )
  let loaded = false;
  let routes = [];

  // props ( external )
  export let path

  beforeUpdate(async () => {
    if ( $auth === null ) return goto('/signin')
    if ( $auth !== null ) {
      const data = await getRoutes($auth);
      if ( [...routes].map(route=>route.name).join(',') !== [...data].map(route=>route.name).join(',') ) routes = data
      if ( ![...data].map(route=>route.href).includes(path.replace(/\/add/g,''))) return goto('/dashboard')
    }
  })
  onMount(()=> loaded = true);
</script>

<svelte:head>
  <meta name="description" content="Employee Online Portal - Allen-Bailey Tag & Label" />
  <meta name="theme-color" content="#fff" />
</svelte:head>

<main class="relative bg-gradient-to-br from-gray-500 to-gray-800 min-h-screen text-gray-100 flex flex-col lg:flex-row">
  {#if loaded}
    <Sidebar {routes} />
    <slot/>
    <Modal.Confirmation />
    <Modal.Error />
    <Modal.Spinner />
    <Modal.Success />
  {:else}
    <div class="w-screen h-screen flex items-center justify-center">
      <Card>
        <Spinner />
      </Card>
    </div>
  {/if}
</main>