<script>
  // props (external)
  export let data = '';
  export let errors = '';
</script>

<main
  class="flex-grow px-[2rem] flex flex-col max-h-[1rem] min-h-[calc(100%_+_env(safe-area-inset-top))] pt-[env(safe-area-inset-top,_0px)] pb-[env(safe-area-inset-bottom,_0px)] overflow-hidden items-center justify-center"
>
  <slot />
</main>
