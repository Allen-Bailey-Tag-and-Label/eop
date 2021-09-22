<script>
  // _imports
  import { createEventDispatcher } from 'svelte';

  // handler
  const clickHandler = input => dispatch('click', { input })

  // props ( internal )
  const classes = 'px-[1.25rem] py-[.75rem] text-[2.5rem] outline-none'
  const dispatch = createEventDispatcher();
</script>

<div class="grid grid-cols-3">
  <button class={classes} on:click={()=>clickHandler(1)}>1</button>
  <button class={classes} on:click={()=>clickHandler(2)}>2</button>
  <button class={classes} on:click={()=>clickHandler(3)}>3</button>
  <button class={classes} on:click={()=>clickHandler(4)}>4</button>
  <button class={classes} on:click={()=>clickHandler(5)}>5</button>
  <button class={classes} on:click={()=>clickHandler(6)}>6</button>
  <button class={classes} on:click={()=>clickHandler(7)}>7</button>
  <button class={classes} on:click={()=>clickHandler(8)}>8</button>
  <button class={classes} on:click={()=>clickHandler(9)}>9</button>
  <button class={classes} on:click={()=>clickHandler('del')}>del</button>
  <button class={classes} on:click={()=>clickHandler(0)}>0</button>
</div>