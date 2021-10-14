<script>
  // _imports
  import { numberFormat } from '$lib/_helpers.js';
  import packaging from './packaging';

  // components
  import { Button, Buttons, Card, Input, Select, Section } from '$components';

  // handlers
  const estimateClickHandler = () => {
    const estimates =  [...nonBlankItems]
      .reduce((obj, item)=>{
        if ( item.type === 'collar' ) {
          obj.packages += quantityNormalize(item.quantity) / packaging.collar.quantity
          obj.totalWeight += quantityNormalize(item.quantity) * packaging.collar.weight
        }
        if ( item.type === 'fastener' ) {
          obj.packages += quantityNormalize(item.quantity) / packaging.fastener[item.item].quantity
          obj.totalWeight += quantityNormalize(item.quantity) * packaging.fastener[item.item].weight
        }
        if ( item.type === 'label' ) {
          let quantity = quantityNormalize(item.quantity);
          if ( item.uom === 'EA' ) quantity /= 250
          obj.packages += quantity / packaging.label[item.size].quantity
          obj.totalWeight += quantity * packaging.label[item.size].weight
        }
        if ( item.type === 'tag' ) {
          let finishing = '';
          if ( item.eyelet ) finishing += 'eyelet'
          if ( item.wired ) finishing += 'wired';
          let quantity = quantityNormalize(item.quantity);
          if ( item.uom === 'M' ) quantity *= 1000;
          obj.packages += quantity / packaging.tag[item.material][finishing].quantity
          obj.totalWeight += quantity * packaging.tag[item.material][finishing].weight
        }
        return obj;
      }, {packages:0, totalWeight:0})
    packages = numberFormat(Math.ceil(estimates.packages));
    totalWeight = numberFormat(Math.ceil(estimates.totalWeight));
  }

  // props ( internal )

  // props ( external )
  export let nonBlankItems;
  export let packages = '0';
  export let quantityNormalize;
  export let totalQuantities;
  export let totalWeight = '0';
</script>

<div class="flex flex-col space-y-[1rem]">
  <div class="flex flex-col space-y-[1rem] flex-grow">
    <Input class="w-[75px]" label="Packages" min={0} type="number" bind:value={packages} />
    <Input class="w-[150px]" label="Total Weight" min={0} type="number" bind:value={totalWeight} />
  </div>
  <Button on:click={estimateClickHandler}>Estimate</Button>
</div>