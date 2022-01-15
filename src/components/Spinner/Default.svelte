<script>
  // imports
  import { onMount } from 'svelte'
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'w-[100px] h-[100px] animate-spinner-rotate'

  // props (external)

  // props (dynamic)
  $: classes = twMerge(defaultClasses, '', $$props.class);

  // lifecycle
  const lifecycle = {
    destroy : () => {},
    mount : async () => {},
  }
  onMount(async() => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    }
  })
</script>

<svg class={classes} viewBox="25 25 50 50">
  <circle class="animate-spinner-dash" cx="50" cy="50" r="20" stroke="currentColor" fill="none" stroke-width="2" stroke-miterlimit="10"/>
</svg>

<slot/>