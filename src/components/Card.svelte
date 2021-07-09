<script>
  // props ( external )
  export let theme    = 'default';

  // props ( dynamic )
  $: classes = {
    bg           : 'bg-white bg-opacity-[1%]',
    filter       : 'backdrop-filter backdrop-blur-md',
    flex         : 'flex flex-col',
    padding      : 'p-[20px]',
    position     : 'relative',
    ring         : 'ring ring-1 ring-white ring-opacity-[2%] ring-inset',
    rounded      : 'rounded',
    shadow       : 'shadow-xl',
    themeClasses : theme === 'default' ? '' : '',
  }
</script>

<div class={Object.values(classes).join(' ') + ' ' + $$props.class}>
  <slot/>
</div>