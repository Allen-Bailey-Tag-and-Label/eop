<script>
  // _imports
  import { serverFetch } from "$lib/_helpers.js";
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
    modal.spinner.show();
    let result = await ups.addressValidation({
      address,
      city,
      state,
      zip,
    });

    if (result?.XAVResponse?.Candidate?.AddressClassification !== undefined) {
      const {
        XAVResponse: {
          Candidate: { AddressClassification, AddressKeyFormat },
        },
      } = result;
      residential = AddressClassification.Code === "1" ? false : true;
      address = AddressKeyFormat.AddressLine;
      city = AddressKeyFormat.PoliticalDivision2;
      state = AddressKeyFormat.PoliticalDivision1;
      zip = AddressKeyFormat.PostcodePrimaryLow;
      shipToAddress = `${address}, ${city} ${state}, ${zip}`;

      result = await ups.rates({
        shipTo: {
          address,
          city,
          state,
          zip,
        },
        weight: averagePackageWeight,
      });

      freightCharge = +packages * result[service];
      originalItems = JSON.parse(JSON.stringify(items));

      modal.spinner.hide();
    } else {
      modal.spinner.hide();
      modal.error.show('Could not validate address.  Please try again.')
    }
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
  const serviceOptions = Object.keys(ups.serviceCodes).map(key=>{
    return { label: ups.serviceCodes[key], value: key };
  })
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

  // stores
  import { modal } from "$stores";
</script>

<form
  on:submit|preventDefault={submitHandler}
  class="flex flex-col space-y-[1rem] items-start">
  <Select label="Service" options={serviceOptions} bind:value={service} />
  <div class="flex space-x-[1rem]">
    <Input label="Address" bind:value={address} />
    <div class="pt-[32px] relative flex">
      <Checkbox bind:checked={residential} class="my-[11px]" />
      <label
        class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] transition duration-200 peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">Residential</label>
    </div>
  </div>
  <div class="flex space-x-[1rem]">
    <Input
      on:change={zipChangeHandler}
      {mask}
      class="text-right w-[110px]"
      label="ZIP"
      bind:value={zip} />
    <Input label="City" bind:value={city} />
    <Select
      label="State"
      options={stateOptions[country]}
      bind:value={state} />
  </div>
  <Button type="submit">Get Rate</Button>
</form>
