<script>
  // imports
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { Backdrop, NavToggle } from '$components';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses = 'z-[2] flex flex-col absolute transition duration-200 w-screen h-full overflow-hidden border-0 border-white/[.1] lg:w-auto';

  // props (external)
  export let direction = 'left';
  export let show = false;
  export let showBackdrop = true;
  export let showCloseButton = true;

  // props (dynamic)
  $: classes = direction === 'top' ?    twMerge(defaultClasses, 'top-0', 'left-0', 'lg:border-b', show ? 'translate-y-[0]' : 'translate-y-[-100%]', $$props.class) : 
               direction === 'right' ?  twMerge(defaultClasses, 'top-0', 'right-0', 'lg:border-l', show ? 'translate-x-[0]' : 'translate-x-[100%]',  $$props.class) :
               direction === 'bottom' ? twMerge(defaultClasses, 'bottom-0', 'left-0', 'lg:border-t', show ? 'translate-y-[0]' : 'translate-y-[100%]',  $$props.class) : 
               direction === 'left' ?   twMerge(defaultClasses, 'top-0', 'left-0', 'lg:border-r', show ? 'translate-x-[0]' : 'translate-x-[-100%]', $$props.class) : 
                                        twMerge(defaultClasses, show ? direction[0] : direction[1], $$props.class)

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

{#if showBackdrop}
  <slot name="backdrop">
    <Backdrop
      bind:show
    />
  </slot>
{/if}
<div
  class={classes}
>
  {#if showCloseButton}
    <slot name="closeButton">
      <div class="flex justify-end">
        <NavToggle
          bind:show
        />
      </div>
    </slot>
  {/if}
  <slot/>
</div>