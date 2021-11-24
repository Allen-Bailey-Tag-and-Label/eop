<script>
  // _imports
  import { serverFetch } from "$lib/_helpers.js";
  import cm from '$lib/freight/cm';
  import * as ups from "$lib/ups";
  import provinces from "provinces-ca";
  import states from "states-us";
  import zipcodes from "zipcodes";

  // components
  import {
    Button,
    Buttons,
    Card,
    Checkbox,
    Input,
    Select,
    Section,
  } from "$components";

  // handlers
  const submitHandler = async () => {
    if ( service === 'c&m' ) {
      // show spinner
      modal.spinner.show();

      try {
        // get c&m total rate with upcharge
        const { quote, total } = await cm({packages, totalWeight, zip})

        // update freightCharge and shipToAddress
        freightCharge = total;
        shipToAddress = `LTL (Quote #${quote}) freight estimate to ${zip}`;
      } catch( error ) {
        modal.error.show(error);
      }

      // hide spinner
      modal.spinner.hide();
    } else if ( service !== 'collect' && service !== 'n30') {
      // show spinner
      modal.spinner.show();

      try {
        // validate address
        ({ address, city, residential, state, zip } = await ups.addressValidation({ address, city, state, zip })); 
        
        // get ups rates
        const rates = await ups.rates({ shipTo: { address, city, state, zip, }, weight: averagePackageWeight });

        // update freightCharge and shipToAddress
        freightCharge = +packages * rates[service];
        shipToAddress = `${ups.serviceCodes[service]} freight estimate to ${address}, ${city} ${state}, ${zip}`;
      } catch( error ) {
        modal.error.show(error);
      }
      // hide spinner
      modal.spinner.hide();

        
    } else {
      freightCharge = 0;
      shipToAddress = '';
    }
    originalItems = JSON.parse(JSON.stringify(items));
  };
  const zipChangeHandler = () => {
    const result = zipcodes.lookup(zip);
    if (result !== undefined) {
      city = result.city;
      state = result.state;
    }
  };

  // props ( internal )
  let address = "";
  let city = "";
  let country = "US";
  const countryOptions = [
    { label: "CA", value: "CA" },
    { label: "US", value: "US" },
  ];
  let residential = false;
  const serviceOptions = [
    {label: 'Collect', value: 'collect', residential: false, streetLevel: false, zip: false}, 
    {label: 'N30', value: 'n30', residential: false, streetLevel: false, zip: false}, 
    {label: 'C&M', value: 'c&m', residential: false, streetLevel: false, zip: true},
    ...Object.keys(ups.serviceCodes).map(key=>{
      return { label: `UPS - ${ups.serviceCodes[key].replace(/Dai/g, 'Day')}`, value: key, residential: true, streetLevel: true, zip: true };
    })
  ].sort((a,b)=>a.label < b.label ? -1 : a.label > b.label ? 1 : 0)
  let state = "";
  const stateOptions = {
    CA: [
      { label: "", value: "" },
      ...provinces.map((province) => {
        return { label: province.abbreviation, value: province.name };
      }),
    ],
    US: [
      { label: "", value: "" },
      ...states.map((state) => {
        return { label: state.abbreviation, value: state.abbreviation };
      }),
    ],
  };
  let zip = "";

  // props ( external )
  export let items;
  export let freightCharge;
  export let originalItems;
  export let packages;
  export let quantityNormalize;
  export let totalWeight;
  export let service = '03'
  export let shipToAddress;

  // props ( dynamic )
  $: averagePackageWeight = Math.ceil(
    quantityNormalize(totalWeight) / quantityNormalize(packages)
  );
  $: mask =
    country === "CA"
      ? { mask: "#0# 0#0", definitions: { "#": /[A-Z]/ } }
      : { mask: "00000", min: 0, max: 99999 };
  $: serviceObj = [...serviceOptions].filter(({value})=>value === service)[0];

  // stores
  import { modal } from "$stores";
</script>

<Card class="flex-grow">
  <form
    on:submit|preventDefault={submitHandler}
    class="flex flex-col flex-grow space-y-[1rem] items-start">
      <div class="flex space-x-[1rem]">
        <Select label="Service" options={serviceOptions} bind:value={service} />
        {#if serviceObj.residential}
          <div class="pt-[32px] relative flex">
            <Checkbox bind:checked={residential} class="my-[11px]" />
            <label
              class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] transition duration-200 peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">Residential</label>
          </div>
        {/if}
      </div>
      {#if serviceObj.streetLevel}
        <Input label="Address" bind:value={address} />
      {/if}
      <div class="flex space-x-[1rem]">
        {#if serviceObj.zip}
          <Input
            on:change={zipChangeHandler}
            {mask}
            class="text-right w-[110px]"
            label="ZIP"
            bind:value={zip} />
        {/if}
        {#if serviceObj.streetLevel}
          <Input label="City" bind:value={city} />
          <Select
            label="State"
            options={stateOptions[country]}
            bind:value={state} />
        {/if}
      </div>
    <Button type="submit">Get Rate</Button>
  </form>
</Card>
