<script>  
  // components
  import { Modal } from '$components'

  // css
  import '$css/style.css';
</script>

<svelte:head>
  <meta name="description" content="Employee Online Portal - Allen-Bailey Tag & Label" />
  <meta name="theme-color" content="#fff" />
</svelte:head>

<main class="relative bg-gradient-to-br from-gray-500 to-gray-800 min-h-screen text-gray-100 flex flex-col">
  <slot/>
  <Modal.Error />
  <Modal.Spinner />
</main>