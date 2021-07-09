<script>
  // components
  import Link from './Link.svelte';

  // props ( external )
  export let routes
  export let show;
  export let toggleMenu;
  
  // props ( dynamic )
  $: classes = {
    alignItems      : 'lg:items-center',
    bg              : '',
    flex            : 'flex flex-col lg:flex-row',
    fontSize        : 'text-[16px]',
    fontWeight      : 'font-medium',
    height          : 'min-h-screen h-full lg:h-auto lg:min-h-auto',
    justifyContent  : '',
    overflow        : 'overflow-y-auto',
    padding         : 'py-[28px]',
    pointerEvents   : `${show?'pointer-events-auto':'pointer-events-none'} lg:pointer-events-auto`,
    position        : 'relative',
    rounded         : 'rounded-lg',
    shadow          : '',
    space           : '',
    textColor       : 'text-blue',
    transition      : 'transition duration-200',
    transform       : `transform ${show?'translate-x-0':'translate-x-[100%]'} lg:translate-x-0`,
  }
</script>

<div class={Object.values(classes).join(' ')}>
  {#each routes as {title, href}, i}
    <Link bind:show {toggleMenu} {title} {href} {i} />
  {/each}
</div>