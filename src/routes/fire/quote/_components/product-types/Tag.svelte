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
    if ( item.uom === 'M' ) item.quantity = Math.floor(+item.quantity.toString().replace(/\,/g,'') / 1000);
    if ( item.uom === 'EA' ) item.quantity = +item.quantity.toString().replace(/\,/g,'') * 1000;
    if ( item.quantity > 50000 ) item.quantity = 50000;
    item.quantity = numberFormat(item.quantity);
  }
  
  // props ( internal )
  const colors = {
    paper: [
      'Blue (Dark)',
      'Blue (Light)',
      'Brown',
      'Buff',
      'Gray',
      'Green (Dark)',
      'Green (Light)',
      'Ivory',
      'Lilac',
      'Manila',
      'Orange',
      'Pink',
      'Red',
      'Salmon',
      'White',
      'Yellow',
      'Fluorescent Green',
      'Fluorescent Orange',
      'Fluorescent Pink',
      'Fluorescent Red',
      'Fluorescent Yellow',
    ],
    tyvek: [
      'Blue (Dark)',
      'Green (Dark)',
      'Red',
      'White',
      'Yellow',
    ],
    polyart: [
      'White',
    ],
  }
  const materialOptions = [
    {label: 'Paper', value: 'paper'},
    {label: 'Tyvek', value: 'tyvek'},
    {label: 'Polyart', value: 'polyart'},
  ]
  const uomOptions = [
    {label: 'EA', value: 'EA'},
    {label: 'M', value: 'M'},
  ]
  
  // props ( external )
  export let item;
  
  // props ( dynamic )
  $: if ( !( 'color' in item ) ) item = {...item, color: 'white'}
  $: if ( !( 'eyelet' in item ) ) item = {...item, eyelet: false}
  $: if ( !( 'material' in item ) ) item = {...item, material: 'paper'}
  $: if ( !( 'quantity' in item ) ) item = {...item, quantity: 0}
  $: if ( !( 'uom' in item ) ) item = {...item, uom: 'M'}
  $: if ( !( 'wired' in item ) ) item = {...item, wired: false}
  $: colorOptions = [...colors[item.material]].map(color=>{
    return { label: color, value: color.toLowerCase().replace(/[\(\)\s]/g, ch=> ({'(':'',')':'',' ':'-'}[ch]))}
  })
  $: max = item.uom === 'EA' ? 500000 : 500
  $: if ( item.material !== 'paper' ) item = {...item, eyelet: true}
  
  // stores
  // import { modal } from '$stores';
  
  // onMount(async() => {
  // })
</script>

<Input type="number" label="Quantity" min={0} {max} bind:value={item.quantity} class="w-[120px]" />
<Select on:change={uomChangeHandler} label="U/M" options={uomOptions} bind:value={item.uom} />
<Select label="Material" options={materialOptions} bind:value={item.material} />
<Select label="Color" options={colorOptions} bind:value={item.color} />
<div class="pt-[32px] relative flex">
  <Checkbox bind:checked={item.eyelet} class="my-[11px] mr-[20px]" />
  <label class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] transition duration-200 peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">Eyelet</label>
</div>
<div class="pt-[32px] relative flex">
  <Checkbox bind:checked={item.wired} class="my-[11px]" />
  <label class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] transition duration-200 peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">Wired</label>
</div>