<script>
  // _imports
  // import { page } from '$app/stores';
  import { currencyFormat, emailIsValid, numberFormat, serverFetch } from '$lib/_helpers.js';
  import { grow, shrink } from '$lib/_transitions';
  import auth from '$lib/auth';
  // import moment from 'moment';
  import * as ups from '$lib/ups';
  import { onMount } from 'svelte';
  import collars from './collars';
  import fasteners from './fasteners';
  import labels from './labels';
  import tags from './tags';
  
  // components
  import { Button, Card, Input, Section, Table } from '$components';
  
  // handlers
  const submitHandler = async () => {
    if ( emailIsValid(email) ) {
      modal.spinner.show();

      const replacements = {
        email: `${user.email}`,
        extension: `${user.extension}`,
        items: [...items].map(item=>{
          return {
            description: description(item),
            unitPrice: currencyFormat(unitPrice(item)),
            extendedPrice: currencyFormat(totalPrice(item)),
          }
        }),
        name: `${user.firstName} ${user.lastName}`,
        productTotal: currencyFormat(productCharge),
        shipping: {
          description:`${ups.serviceCodes[service]} freight estimate to ${shipToAddress}`,
          extendedPrice: currencyFormat(freightCharge),
        },
        title: `${user.title}`,
        total: currencyFormat(productCharge + freightCharge)
      }

      if ( copyChanges > 0)
      replacements.copyChanges = {
        description: `${copyChanges} copy / stock change${copyChanges === 1 ? '' : 's'}`,
        unitPrice: currencyFormat(23),
        extendedPrice: currencyFormat(copyChanges * 23),
      }

      const result = await serverFetch({
        method: 'POST',
        href: '/api/email/send',
        body: {
          from: `"${user.firstName} ${user.lastName}" <abtl.noreply@gmail.com>`,
          to: [email],
          cc: `${user.email}`,
          replyTo: `${user.email}`,
          subject: 'ABTL - Fire Quote',
          template: 'fire/quote.html',
          replacements
        }
      })

      modal.spinner.hide();
      modal.success.show('Successfully emailed quote.')
    }
  }

  // helper
  const description = item => {
    if ( item.type === 'collar' ) return `${item.quantity} roll${item.quantity === '1' ? '' : 's'} (100/roll) of ${item.size} ${item.color} collars`
    if ( item.type === 'fastener' ) {
      if ( item.item === 'diamond-clip' ) return `${numberFormat(item.quantity*1000)} diamond clips`;
      if ( item.item === '5-secur-a-tie') return `${item.quantity} box${item.quantity === '1' ? '' : 'es'} (5,000/box) of ${humanReadableColors[item.color]} 5" Secur-A-Tie® circlular fasteners`;
      if ( item.item === '9-tamper-seal') return `${item.quantity} box${item.quantity === '1' ? '' : 'es'} (1,000/box) of ${humanReadableColors[item.color]} 9" tamper seals | 10-15 lb break point`;
      return `${item.quantity} bundle${item.quantity === '1' ? '' : 's'} (1,000/bundle) of loose 26G-12" wire bundles`;
    }
    if ( item.type === 'label' ) return `${numberFormat(item.quantity*250)} (${numberFormat(item.quantity)} rolls) of ${item.size} labels`;
    if ( item.type === 'tag' ) {
      let quantity = quantityNormalize( item.quantity );
      if ( item.uom === 'M' ) quantity *= 1000;
      let description = [`${numberFormat(quantity)} ${humanReadableColors[item.color]} ${item.material} tags`];
      let extras = [];
      if ( item.eyelet ) extras.push('1/4" metal zinc eyelet');
      if ( item.wired ) extras.push('26g - 12" attached wire')
      extras = extras.join(' and ');
      if ( extras !== '' ) description.push(extras);
      return `${description.join(' with ')}`;
    }
  }
  const humanReadableColors = {
    'clear-natural' : 'clear / natural',
    'red' : 'red',
    'black' : 'black',
    'blue' : 'blue',
    'green' : 'green',
    'yellow' : 'yellow',
    'white' : 'white',
    'orange' : 'orange',
    'gray-light' : 'light gray',
    'blue-dark' : 'dark blue',
    'blue-light' : 'light blue',
    'brown':'brown',
    'buff':'buff',
    'gray':'gray',
    'green-dark':'dark green',
    'green-light':'light green',
    'ivory':'ivory',
    'lilac':'lilac',
    'manila':'manila',
    'pink':'pink',
    'red':'red',
    'salmon':'salmon',
    'fluorescent-green':'fluorescent green',
    'fluorescent-orange':'fluorescent orange',
    'fluorescent-pink':'fluorescent pink',
    'fluorescent-red':'fluorescent red',
    'fluorescent-yellow':'fluorescent yellow',
  }
  const totalPrice = item => {
    if ( item.type !== 'tag' ) return unitPrice(item) * quantityNormalize(item.quantity)
    return unitPrice(item) * quantityNormalize(item.quantity) / (item.uom === 'EA' ? 1000 : 1)
  }
  const unitPrice = item => {
    if ( item.type === 'collar' ) return collars[item.size][totalQuantities.collar[item.size] > 20 ? 20 : totalQuantities.collar[item.size]];
    if ( item.type === 'fastener' ) return fasteners[item.item];
    if ( item.type === 'label' ) return labels[item.size][Math.floor(totalQuantities.label[item.size] / 4 ) > 25 ? 25 : Math.floor(totalQuantities.label[item.size] / 4 )];
    if ( item.type === 'tag' ) {
      let ppm = tags[item.material][Math.floor(totalQuantities.tag[item.material] / 1000) < 1 ? 1 : Math.floor(totalQuantities.tag[item.material] / 1000) > 50 ? 50 : Math.floor(totalQuantities.tag[item.material] / 1000)];
      if ( item.material === 'paper' && item.color.includes('fluorescent')) ppm += 6;
      if ( item.material === 'tyvek' && item.color !== 'white' ) ppm += 23;
      if ( item.eyelet && item.material === 'paper' ) ppm += 6.25;
      if ( item.wired && item.material === 'paper' ) ppm += 16.75;
      if ( item.wired && item.material !== 'paper' ) ppm += 18;
      return ppm
    }
  }

  // props ( internal )
  const cellClasses = 'p-[10px]'
  let email = '';
  let user;
  
  // props ( external )
  export let freightCharge;
  export let items;
  export let nonBlankItems;
  export let originalItems;
  export let quantityNormalize;
  export let service;
  export let shipToAddress;
  export let totalQuantities;
  
  // props ( dynamic )
  $: copyChanges = [...items]
    .filter(item=>( item.type === 'label' || item.type === 'tag' ) && quantityNormalize(item.quantity) > 0 )
    .reduce((obj, item)=>{
      let key = item.type;
      if ( item.type === 'label' ) key += item.size;
      if ( item.type === 'tag' ) key += item.material;
      if ( !(key in obj.dict) ) obj.dict[key] = 0;
      obj.dict[key]++;
      if ( obj.dict[key] > 1 ) obj.total++;
      return obj;
    }, {
      dict:{}, 
      total:0
    }).total
  $: productCharge = productTotal + (copyChanges * 23)
  $: productTotal = [...nonBlankItems].reduce((total, item)=>total + totalPrice(item), 0);
  // $: console.log(JSON.stringify(items), JSON.stringify(originalItems))
  // $: console.log({items, totalQuantities})

  // stores
  import { modal } from '$stores';
  
  onMount(async() => {
    user = await serverFetch(`/api/auth/get/user?auth=${$auth}`);
  })
</script>

{#if nonBlankItems.length > 0 && JSON.stringify(items) === JSON.stringify(originalItems)}
  <div class="flex flex-col space-y-[1rem]">
    <Card>
      <Table>
        <thead slot="thead">
          <tr>
            <th class="{cellClasses}">Description</th>
            <!-- <th class="{cellClasses}">Unit Price</th> -->
            <th class="{cellClasses}">Extended</th>
          </tr>
        </thead>
        <tbody slot="tbody">
          {#each items as item}
            {#if quantityNormalize(item.quantity) > 0}
              <tr>
                <td class="{cellClasses}">{description(item)}</td>
                <!-- <td class="{cellClasses} text-right">{currencyFormat(unitPrice(item))}</td> -->
                <td class="{cellClasses} text-right">{currencyFormat(totalPrice(item))}</td>
              </tr>
            {/if}
          {/each}
          {#if copyChanges > 0}
            <tr>
              <td class="{cellClasses}">{copyChanges} copy / stock change{copyChanges === 1 ? '' : 's'}</td>
              <!-- <td class="{cellClasses} text-right">$23.00</td> -->
              <td class="{cellClasses} text-right">{currencyFormat(copyChanges * 23)}</td>
            </tr>
          {/if}
          <tr class="border-t border-gray-200 border-opacity-30">
            <td colspan="1" class="{cellClasses} text-right">Product Total</td>
            <td class="{cellClasses} text-right">{currencyFormat(productCharge)}</td>
          </tr>
          {#if shipToAddress !== ''}
            <tr>
              <td colspan="1" class="{cellClasses}">{ups.serviceCodes[service]} freight estimate to {shipToAddress}</td>
              <td class="{cellClasses} text-right">{currencyFormat(freightCharge)}</td>
            </tr>
          {/if}
          <tr class="border-t border-gray-200 border-opacity-30">
            <td colspan="1" class="{cellClasses} text-right">Total ( + sales tax if applicable )</td>
            <td class="{cellClasses} text-right">{currencyFormat(productCharge + freightCharge)}</td>
          </tr>
        </tbody>
      </Table>
    </Card>
    <Card>
      <form on:submit|preventDefault={submitHandler} class="flex space-x-[1rem] items-end">
        <Input type="email" bind:value={email} label="Email" />
        {#if emailIsValid(email) }
          <div class="flex" in:grow out:shrink>
            <Button type="submit">Send Quote</Button>
          </div>
        {/if}
      </form>
    </Card>
  </div>
{/if}