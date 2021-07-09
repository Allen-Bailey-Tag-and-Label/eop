<script>
  // handlers
  const closeHandler = () => {
    if ( closeable ) show = !show
  }

  // props ( external )
  export let closeable = true;
  export let show = false;

  // props ( dynamic )
  $: classes = {
    pointerEvents: `${show?'pointer-events-auto':'pointer-events-none'}`,
    position: 'fixed',
    top: 'top-0',
    left: 'left-0',
    width: 'w-screen',
    height:'h-screen',
    flex: 'flex items-center justify-center',
    transition: 'transition duration-200',
  }
</script>

<div class={Object.values(classes).join(' ')}>
  <div on:click={closeHandler} class="absolute top-0 left-0 w-full h-full -z-1 transition duration-200 {show?'opacity-100':'opacity-0'}" />
  <slot/>
</div>