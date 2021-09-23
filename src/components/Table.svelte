<script>
  // props ( external )
  export let width = "w-full"
  
  // props ( dynamic )
  $: classes = `${width}`;
</script>

<div class="overflow-auto w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-track-rounded-full">
  <table class={classes}>
    <slot name="thead">
      <thead></thead>
    </slot>
    <slot name="tbody">
      <tbody></tbody>
    </slot>
  </table>
</div>