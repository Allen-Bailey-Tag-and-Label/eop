<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  // utilities

  // handlers
  const clickHandler = () => show = !show;

  // props (internal)
  const defaultClasses = 'relative cursor-pointer w-[3.5rem] h-[3.5rem] pointer-events-auto flex flex-col items-center justify-center space-y-[.4375rem]';
  // const events = getEvents();

  // props (external)
  export let show = false;

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

<button
  on:click={clickHandler}
  class={classes}
>
  <div class="w-[1.5rem] h-[1px] bg-white transition duration-200 transform {show ? 'rotate-[45deg] translate-y-[.5rem]' : 'rotate-[0deg] translate-y-0'}"></div>
  <div class="w-[1.5rem] h-[1px] bg-white transition duration-200 transform {show ? 'opacity-0' : 'opacity-100'}"></div>
  <div class="w-[1.5rem] h-[1px] bg-white transition duration-200 transform {show ? 'rotate-[-45deg] translate-y-[-.5rem]' : 'rotate-[0deg] translate-y-0'}"></div>
</button>