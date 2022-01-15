<script>
  // imports
  import { onMount } from "svelte";
  import { twMerge } from "tailwind-merge";
	import { getEvents } from '$actions';

  // utilities

  // handlers

  // props (internal)
  const defaultClasses =
    "font-bold outline-none focus:outline-none px-[1.875rem] py-[.6875rem] ring ring-opacity-0 focus:ring-opacity-30 rounded text-center transition duration-200 whitespace-nowrap flex justify-center items-center";
  let classes = defaultClasses;
  const events = getEvents();

  // props (external)
  export let theme = 'default';
  export let type = 'button';

  // props (dynamic)
  $: if (theme === 'default') classes = twMerge(classes, 'bg-primary-500 ring-primary-500 text-gray-900 hover:bg-primary-700 focus:bg-primary-700', $$props.class);
  $: if (theme === 'error') classes = twMerge(classes, 'bg-red-500 ring-red-500 text-gray-900 hover:bg-red-700 focus:bg-red-700', $$props.class);
  $: if (theme === 'success') classes = twMerge(classes, 'bg-green-500 ring-green-500 text-gray-900 hover:bg-green-700 focus:bg-green-700', $$props.class);
  $: if (theme === 'secondary') classes = twMerge(classes, 'bg-purple-500 ring-purple-500 text-gray-900 hover:bg-purple-700 focus:bg-purple-700', $$props.class);
  $: if (type === 'icon') classes = twMerge(classes, 'w-[1.5rem] h-[1.5rem] p-0', $$props.class)

  // lifecycle
  const lifecycle = {
    destroy: () => {},
    mount: async () => {},
  };
  onMount(async () => {
    await lifecycle.mount();
    return () => {
      lifecycle.destroy();
    };
  });
</script>

<button 
  class={classes}
  style={$$props.style || ''}
  {type}
  use:events
 >
  <slot />
</button>
