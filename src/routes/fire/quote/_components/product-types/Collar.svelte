<script>
  // _imports
  // import { page } from '$app/stores';
  // import { serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  // import moment from 'moment';
  // import { onMount } from 'svelte';
  
  // components
  import { Button, Buttons, Card, Checkbox, Input, Select, Section } from '$components';
  
  // handlers
  const colorChangeHandler = () => {
    const dict = {
      blue : 'large',
      green : 'small',
      gray : 'medium',
    }
    item = {...item, size: dict[item.color]}
  }
  const sizeChangeHandler = () => {
    const dict = {
      large : 'blue',
      medium : 'gray',
      small : 'green',
    }
    item = {...item, color: dict[item.size]}
  }
  
  // props ( internal )
  const colorOptions = [
    {label: 'Blue', value: 'blue'},
    {label: 'Green', value: 'green'},
    {label: 'Gray', value: 'gray'},
  ]
  const sizeOptions = [
    {label: 'Small', value: 'small'},
    {label: 'Medium', value: 'medium'},
    {label: 'Large', value: 'large'},
  ]
  const uomOptions = [
    {label: 'RL', value: 'RL'},
  ]
  
  // props ( external )
  export let item;
  
  // props ( dynamic )
  $: if ( !( 'color' in item ) ) item = {...item, color: 'blue'}
  $: if ( !( 'quantity' in item ) ) item = {...item, quantity: 0}
  $: if ( !( 'size' in item ) ) item = {...item, size: 'large'}
  $: if ( !( 'uom' in item ) ) item = {...item, uom: 'RL'}
  $: max = item.uom === 'EA' ? 20000 :
           item.uom === 'M'  ? 20 :
                               200
  
  // stores
  // import { modal } from '$stores';
  
  // onMount(async() => {
  // })
</script>

<Input type="number" label="Quantity" min={0} {max} bind:value={item.quantity} class="w-[120px]" />
<Select label="U/M" options={uomOptions} bind:value={item.uom} />
<Select on:change={colorChangeHandler} label="Color" options={colorOptions} bind:value={item.color} />
<Select on:change={sizeChangeHandler} label="Size" options={sizeOptions} bind:value={item.size} />