<script>
// imports
import { page } from '$app/stores';

// utilities

// handlers

// props (internal)

// props (external)

// props (dynamic)
$: title = [
  'Employee Online Portal - Allen Bailey Tag & Label',
  ...$page.url.pathname
    .split('/')
    .filter((address) => address !== '')
    .map((address) => 
      address
        .split('-')
        .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
        .join(' ')
    )
].reverse()
  .join(' - ');
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<slot/>