<script>
  // _imports
  // import { page } from '$app/stores';
  // import { serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  // import moment from 'moment';
  // import { onMount } from 'svelte';
  
  // components
  import { Button, Buttons, Card, Select, Section } from '$components';
  import Icon, {Plus, Trash} from 'svelte-hero-icons'
  import Collar from './_components/product-types/Collar.svelte';
  import Fastener from './_components/product-types/Fastener.svelte';
  import Label from './_components/product-types/Label.svelte';
  import Tag from './_components/product-types/Tag.svelte';
  import Address from './_components/address/Address.svelte';
  import Freight from './_components/freight/Freight.svelte';
  import Pricing from './_components/pricing/Pricing.svelte';
  
  // handlers
  const addClickHandler = () => {
    items = [...items, { type: '' }]
  }
  const deleteHandler = i => {
    let temp = [...items];
    temp.splice(i, 1);
    items = temp;
  }
  const keydownHandler = e => {
    if ( e.key === 'i' && e.ctrlKey ) addClickHandler();
  }
  const typeChangeHandler = (i, type) => {
    let temp = [...items];
    temp[i] = { type }
    items = temp;
  }

  // helpers
  const quantityCalculator = ({type, uom, quantity, item}) => {
    quantity = quantityNormalize(quantity);
    if ( uom === 'M' ) quantity *= 1000;
    if ( type === 'label' && uom === 'RL' ) quantity *= 250;
    if ( type === 'collar' && uom === 'RL' ) quantity *= 100;
    if ( type === 'fastener' && item === '5-secur-a-tie' && uom === 'BX' ) quantity *= 5000;
    if ( type === 'fastener' && item === '9-tamper-seal' && uom === 'BX' ) quantity *= 1000;
    return quantity
  }
  const quantityNormalize = quantity => quantity === undefined ? 0 : +quantity.toString().replace(/\,/g, '')
  
  // props ( internal )
  let freightCharge = 0;
  let items = [
    { type: '' }
  ];
  let originalItems = JSON.parse(JSON.stringify(items));
  let packages = '0';
  let service = '03';
  let shipToAddress = '';
  const typeComponents = {
    'collar' : Collar,
    'fastener' : Fastener,
    'label' : Label,
    'tag' : Tag,
  }
  const typeOptions = [
    {label:'', value:''},
    {label:'Collar', value:'collar'},
    {label:'Fastener', value:'fastener'},
    {label:'Label', value:'label'},
    {label:'Tag', value:'tag'},
  ]
  let totalWeight = '0';
  
  // props ( external )
  
  // props ( dynamic )
  $: nonBlankItems = [...items].filter(item=>item.type !== '' && quantityNormalize(item.quantity) > 0 )
  $: totalQuantities = {
    collar: {
      small: [...items].filter(item=>item.type === 'collar' && item?.size === 'small').reduce((acc, item)=>acc + quantityCalculator(item), 0) / 100,
      medium: [...items].filter(item=>item.type === 'collar' && item?.size === 'medium').reduce((acc, item)=>acc + quantityCalculator(item), 0) / 100,
      large: [...items].filter(item=>item.type === 'collar' && item?.size === 'large').reduce((acc, item)=>acc + quantityCalculator(item), 0) / 100,
    },
    label: {
      small: [...items].filter(item=>item.type === 'label' && item?.size === 'small').reduce((acc, item)=>acc + quantityCalculator(item), 0),
      large: [...items].filter(item=>item.type === 'label' && item?.size === 'large').reduce((acc, item)=>acc + quantityCalculator(item), 0),
    },
    tag: {
      paper: [...items].filter(item=>item.type === 'tag' && item?.material === 'paper').reduce((acc, item)=>acc + quantityCalculator(item), 0),
      tyvek: [...items].filter(item=>item.type === 'tag' && item?.material === 'tyvek').reduce((acc, item)=>acc + quantityCalculator(item), 0),
      polyart: [...items].filter(item=>item.type === 'tag' && item?.material === 'polyart').reduce((acc, item)=>acc + quantityCalculator(item), 0),
    },
  }
  // $: console.log(items)
  
  // stores
  // import { modal } from '$stores';
  
  // onMount(async() => {
  // })
</script>

<svelte:window on:keydown={keydownHandler} />

<Section flex="flex" class="space-x-[1rem]">
  <div class="flex flex-col space-y-[1rem] flex-grow">
    <Card class="flex-grow">
      <div class="flex space-x-[1rem] justify-end">
        <Buttons.Icon on:click={addClickHandler}><Icon src={Plus} class="w-[24px] h-[24px]" /></Buttons.Icon>
      </div>
      <div class="flex flex-col space-y-[1rem]">
        {#each items as item, i}
          <div class="flex space-x-[1rem]">
            {#if i > 0}
              <Buttons.Icon theme="error" on:click={()=>deleteHandler(i)} class="mt-[36px] mb-[4px]"><Icon src={Trash} class="w-[24px] h-[24px]" /></Buttons.Icon>
            {:else}
              <div class="min-w-[36px] block" />
            {/if}
            <Select on:change={()=>typeChangeHandler(i, item.type)} label="Type" options={typeOptions} bind:value={item.type} />
            {#if item.type !== '' }
              <svelte:component this={typeComponents[item.type]} bind:item />
            {/if}
          </div>
        {/each}
      </div>
    </Card>
    <div class="flex space-x-[1rem]">
      <Freight bind:nonBlankItems bind:packages bind:totalQuantities bind:totalWeight {quantityNormalize} />
      <Address bind:originalItems bind:items bind:service bind:shipToAddress bind:freightCharge bind:packages bind:totalWeight {quantityNormalize} />
    </div>
  </div>
  <Pricing bind:service bind:shipToAddress bind:freightCharge bind:items bind:originalItems bind:nonBlankItems bind:totalQuantities {quantityNormalize} />
</Section>