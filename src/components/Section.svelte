<script>
  // props ( external )
  export let flex = 'flex flex-col';
  export let padding  = 'p-[24px]';
  export let position = '';
  export let width = 'w-full'

  // props ( dynamic )
  $: classes = `${flex} ${padding} ${position} ${width} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

<section class={classes}>
  <slot/>
</section>