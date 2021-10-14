<script>
  // _imports
  // import { page } from '$app/stores';
  import { numberFormat } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  // import moment from 'moment';
  // import { onMount } from 'svelte';
  
  // components
  import { Button, Buttons, Card, Checkbox, Input, Select, Section } from '$components';
  
  // handlers
  const uomChangeHandler = () => {
    if ( item.uom === 'RL' ) item.quantity = Math.floor(+item.quantity.toString().replace(/\,/g,'') / 250);
    if ( item.uom === 'EA' ) item.quantity = +item.quantity.toString().replace(/\,/g,'') * 250;
    if ( item.quantity > 25000 ) item.quantity = 25000;
    item.quantity = numberFormat(item.quantity);
  }
  
  // props ( internal )
  const sizeOptions = [
    {label: 'Large', value: 'large'},
    {label: 'Small', value: 'small'},
  ]
  const uomOptions = [
    {label: 'EA', value: 'EA'},
    {label: 'RL', value: 'RL'},
  ]
  
  // props ( external )
  export let item;
  
  // props ( dynamic )
  $: if ( !( 'quantity' in item ) ) item = {...item, quantity: 0}
  $: if ( !( 'size' in item ) ) item = {...item, size: 'large'}
  $: if ( !( 'uom' in item ) ) item = {...item, uom: 'RL'}
  $: max = item.uom === 'EA' ? 250000 :
           item.uom === 'M'  ? 250 :
                               10000
  
  // stores
  // import { modal } from '$stores';
  
  // onMount(async() => {
  // })
</script>

<Input type="number" label="Quantity" min={0} {max} bind:value={item.quantity} class="w-[120px]" />
<Select on:change={uomChangeHandler} label="U/M" options={uomOptions} bind:value={item.uom} />
<Select label="Size" options={sizeOptions} bind:value={item.size} />