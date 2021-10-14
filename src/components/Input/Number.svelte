<script>
  // _imports
  import { imask } from '@imask/svelte';
  import { createEventDispatcher } from 'svelte';

  // components

  // handlers

  // props ( internal)
  const dispatch = createEventDispatcher();

  // props ( external )
  export let disabled        = false;
  export let label           = '';
  export let min             = 0;
  export let max             = undefined
  export let name            = '';
  export let placeholder     = '';
  export let readonly        = false;
  export let style           = '';
  export let type            = '';
  export let value           = '';

  // store
  // import { modal } from '$stores';

</script>

<input {disabled} {readonly} on:change type="text" use:imask={{mask:Number, min, max, thousandsSeparator: ','}} {name} bind:value class="text-right {$$props.class}" {placeholder} {style}/>