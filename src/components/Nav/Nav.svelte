<script>
  // components
  import Hamburger from './Hamburger.svelte';
  import Overlay from './Overlay.svelte';
  import NavWrapper from './NavWrapper.svelte';

  // handlers
  const toggleMenu = () => show = !show;

  // props ( external )
  export let routes;
  export let show = false;

  // props ( dynamic );
  $: classes = {
    flex          : '',
    height        : 'h-screen',
    left          : 'left-[50%] lg:left-auto',
    opacity       : `${show?'opacity-100':'opacity-0'} lg:opacity-100`,
    overflow      : 'overflow-hidden',
    padding       : '',
    pointerEvents : 'pointer-events-none',
    position      : 'absolute',
    top           : 'top-[0px] lg:top-auto',
    transform     : 'transform translate-x-[-50%] lg:translate-x-0',
    transition    : 'transition duration-200 lg:duration-0',
    width         : 'w-screen lg:w-auto',
    zIndex        : 'z-20',
  };
</script>

<Hamburger bind:show {toggleMenu} />
<Overlay bind:show {toggleMenu} />

<div class={Object.values(classes).join(' ')}>
  <NavWrapper bind:show {routes} {toggleMenu} />
</div>