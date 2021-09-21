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
  const itemChangeHandler = () => {
    item.color = '';
    if ( item.item === 'diamond-clip' ) item.uom = 'M';
    if ( item.item === '5-secur-a-tie' ) item.uom = 'BX';
    if ( item.item === '9-tamper-seal' ) item.uom = 'BX';
    if ( item.item === 'loose-26-wire-bundle' ) item.uom = 'M';
  }
  
  // props ( internal )
  const colorOptions = {
    '5-secur-a-tie' : [
      {label: '', value:''},
      {label: 'Black', value:'black'},
      {label: 'Clear / Natural', value:'clear-natural'},
      {label: 'Red', value:'red'},
    ],
    '9-tamper-seal' : [
      {label: '', value:''},
      {label: 'Black', value:'black'},
      {label: 'Blue', value:'blue'},
      {label: 'Green', value:'green'},
      {label: 'Gray (Light)', value:'gray-light'},
      {label: 'Orange', value:'orange'},
      {label: 'Red', value:'red'},
      {label: 'White', value:'white'},
      {label: 'Yellow', value:'yellow'},
    ]
  }
  const itemOptions = [
    {label: '', value: ''},
    {label: 'Diamond Clip', value: 'diamond-clip'},
    {label: '5" Secur-A-Tie', value: '5-secur-a-tie'},
    {label: '9" Tamper Seal', value: '9-tamper-seal'},
    {label: 'Loose 26G-12" Wire Bundle', value: 'loose-26-wire-bundle'},
  ]
  const uomOptions = {
    '' : [],
    'diamond-clip' : [
      {label: 'M', value: 'M'},
    ],
    '5-secur-a-tie' : [
      {label: 'BX', value: 'BX'},
    ],
    '9-tamper-seal' : [
      {label: 'BX', value: 'BX'},
    ],
    'loose-26-wire-bundle' : [
      {label: 'M', value: 'M'},
    ],
  }
  
  // props ( external )
  export let item;
  
  // props ( dynamic )
  $: if ( !( 'color' in item) ) item = {...item, color: '' }
  $: if ( !( 'item' in item ) ) item = {...item, item: 'diamond-clip'}
  $: if ( !( 'quantity' in item ) ) item = {...item, quantity: 0}
  $: if ( !( 'uom' in item ) ) item = {...item, uom: 'M'}
  $: max = item.uom === 'EA' ? 500000 :
           item.uom === 'M'  ? 500 :
           (item.uom === 'BX' && item.item === '5-secur-a-tie') ? 100 : 500
  
  // stores
  // import { modal } from '$stores';
  
  // onMount(async() => {
  // })
</script>

<Input type="number" label="Quantity" {max} bind:value={item.quantity} class="w-[120px]" />
<Select label="U/M" options={uomOptions[item.item]} bind:value={item.uom} />
<Select on:change={itemChangeHandler} label="Item" options={itemOptions} bind:value={item.item} />
{#if (item.item === '5-secur-a-tie' || item.item === '9-tamper-seal')}
  <Select label="Color" options={colorOptions[item.item]} bind:value={item.color} />
{/if}