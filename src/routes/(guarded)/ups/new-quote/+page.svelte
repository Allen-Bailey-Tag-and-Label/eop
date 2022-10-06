<script>
  // imports
  import zipcodes from 'zipcodes';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button, Fieldset, Form, H6, Input, Select, TitleBar } from '$components';
  import { clientConnection as socketio } from '$lib/socketio';
  import { collections, routeStates, theme } from '$stores';
  import Modals from './Modals.svelte';
  import { stateOptions } from '../stateAbbreviations';

  // handlers
  const getRates = async () => {
    modal.progress.rates.show = true;
    const formData = new FormData();
    formData.append(
      'RateRequest',
      JSON.stringify({
        Shipment: {
          Shipper: {
            Address: $routeStates[$page.url.pathname].Shipper
          },
          ShipTo: {
            Address: $routeStates[$page.url.pathname].ShipTo
          },
          Package: {
            PackagingType: {
              Code: '02'
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'LBS'
              },
              Weight: Math.ceil(
                +$routeStates[$page.url.pathname].PackageInfo.Weight /
                  +$routeStates[$page.url.pathname].PackageInfo.Packages
              ).toString()
            }
          }
        }
      })
    );
    const response = await fetch('/api/ups?/rates', {
      method: 'POST',
      header: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: formData
    });

    const { data: result } = await response.json();

    if (result === undefined) throw 'Could not find any candidates for the provided address.';

    rates = result.RateResponse.RatedShipment.reduce((obj, { Service, TotalCharges }) => {
      const row = {
        description: serviceCodes[Service.Code],
        rate: +TotalCharges.MonetaryValue * +$routeStates[$page.url.pathname].PackageInfo.Packages
      };
      return [...obj, row];
    }, []).sort((a, b) => {
      if (a.rate < b.rate) return -1;
      if (a.rate > b.rate) return 1;
      return 0;
    });

    modal.progress.rates.show = false;
  };
  const nonValidatedRate = async () => {
    if (submitted) return;
    classification = 'Unclassified';
    submitted = true;
    try {
      await getRates();
      await saveQuote();
      goto(`/ups/quote/${quoteNum}`);
    } catch (error) {
      modal.progress.rates.show = false;
      modal.error.body = error;
      modal.error.show = true;
      modal.progress.rates.show = false;
      modal.progress.saveQuote.show = false;
      modal.progress.validation.show = false;
      console.log({ error });
    }
    submitted = false;
  };
  const saveQuote = async () => {
    modal.progress.saveQuote.show = true;
    const formData = new FormData();
    formData.append('collection', 'ups-quotes');
    formData.append(
      'insert',
      JSON.stringify({
        classification,
        data: new Date(),
        packageInfo: $routeStates[$page.url.pathname].PackageInfo,
        quote: +$collections['ups-quotes'][$collections['ups-quotes'].length - 1].quote + 1,
        rates,
        shipper: $routeStates[$page.url.pathname].Shipper,
        shipTo: $routeStates[$page.url.pathname].ShipTo
      })
    );
    const response = await fetch('/api/db?/create', {
      body: formData,
      method: 'POST'
    });
    const {
      data: { doc }
    } = await response.json();
    quoteNum = doc.quote;
    socketio.emit('db.create.doc', { collection: 'ups-quotes', doc });
    modal.progress.saveQuote.show = false;
  };
  const submitHandler = async (e) => {
    if (e !== undefined) e.preventDefault();
    if (submitted) return;
    submitted = true;
    try {
      await validateAddress();
      await getRates();
      await saveQuote();
      goto(`/ups/quote/${quoteNum}`);
    } catch (error) {
      modal.error.body = error;
      modal.error.show = true;
      modal.progress.rates.show = false;
      modal.progress.saveQuote.show = false;
      modal.progress.validation.show = false;
      console.log({ error });
    }
    submitted = false;
  };
  const updateShipToAddress = ({
    AddressLine,
    PoliticalDivision1,
    PoliticalDivision2,
    PostcodePrimaryLow
  }) => {
    $routeStates[$page.url.pathname].ShipTo = {
      AddressLine: AddressLine,
      City: PoliticalDivision2,
      StateProvinceCode: PoliticalDivision1,
      PostalCode: PostcodePrimaryLow,
      CountryCode: 'US'
    };
  };
  const validateAddress = async () => {
    modal.progress.validation.show = true;
    const formData = new FormData();
    formData.append(
      'XAVRequest',
      JSON.stringify({
        AddressKeyFormat: {
          AddressLine: [$routeStates[$page.url.pathname].ShipTo.AddressLine],
          PoliticalDivision2: $routeStates[$page.url.pathname].ShipTo.City,
          PoliticalDivision1: $routeStates[$page.url.pathname].ShipTo.StateProvinceCode,
          PostcodePrimaryLow: $routeStates[$page.url.pathname].ShipTo.PostalCode,
          CountryCode: 'US'
        }
      })
    );
    const response = await fetch('/api/ups?/validate-address', {
      body: formData,
      method: 'POST'
    });

    const { data: result } = await response.json();

    // destructure result
    const {
      XAVResponse: { Candidate, NoCandidatesIndicator }
    } = result;

    // check if no candidates available
    if (Candidate === undefined) throw 'Address could not be validated';

    // check if multiple candidates
    if (Array.isArray(Candidate)) {
      modal.progress.validation.show = false;
      modal.candidate.candidates = Candidate;
      return (modal.candidate.show = true);
    }

    const { AddressClassification, AddressKeyFormat } = Candidate;
    classification = AddressClassification.Description;
    updateShipToAddress(AddressKeyFormat);

    modal.progress.validation.show = false;
  };
  const zipChangeHandler = (whichAddress) => {
    const zip =
      whichAddress === 'shipper'
        ? $routeStates[$page.url.pathname].Shipper.PostalCode
        : $routeStates[$page.url.pathname].ShipTo.PostalCode;
    const result = zipcodes.lookup(zip);
    if (result !== undefined) {
      if (whichAddress === 'shipper') {
        $routeStates[$page.url.pathname].Shipper.City = result.city;
        $routeStates[$page.url.pathname].Shipper.StateProvinceCode = result.state;
      }
      if (whichAddress === 'shipTo') {
        $routeStates[$page.url.pathname].ShipTo.City = result.city;
        $routeStates[$page.url.pathname].ShipTo.StateProvinceCode = result.state;
      }
    }
  };

  // props (internal)
  let classification = 'Unclassified';
  let modal = {
    candidate: {
      candidates: [],
      show: false
    },
    error: {
      body: '',
      show: false
    },
    progress: {
      rates: {
        show: false
      },
      saveQuote: {
        show: false
      },
      validation: {
        show: false
      }
    }
  };
  let quoteNum = 0;
  let rates = {};
  const serviceCodes = {
    '03': 'Ground',
    '12': '3 Day Select',
    '02': '2nd Day Air',
    '59': '2nd Day Air A.M.',
    '13': 'Next Day Air Saver',
    '01': 'Next Day Air',
    '14': 'Next Day Air Early'
  };
  let submitted = false;

  Object.assign(String.prototype, {
    toCurrency() {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      });
      return formatter.format(this);
    }
  });

  if ($routeStates?.[$page.url.pathname] === undefined) {
    $routeStates[$page.url.pathname] = {
      PackageInfo: {
        Packages: '1',
        Weight: '30'
      },
      Shipper: {
        AddressLine: '3177 Lehigh Street',
        City: 'Caledonia',
        StateProvinceCode: 'NY',
        PostalCode: '14423',
        CountryCode: 'US'
      },
      ShipTo: {
        AddressLine: '',
        City: '',
        StateProvinceCode: '',
        PostalCode: '',
        CountryCode: 'US'
      }
    };
  }
</script>

<div class="flex flex-col flex-grow overflow-hidden">
  <TitleBar>
    <svelte:fragment slot="title">UPS - New Quote</svelte:fragment>
  </TitleBar>
  <div class="flex flex-grow overflow-hidden">
    <Form
      class="p-[2rem] overflow-auto max-w-none lg:w-auto lg:mx-auto lg:items-center lg:justify-center"
      on:submit={submitHandler}
      use={[]}
    >
      <div class="flex flex-col space-y-[1rem] lg:space-y-[0] lg:flex-row lg:space-x-[1rem]">
        <div class="flex flex-col space-y-[1rem]">
          <H6>Ship From</H6>
          <Fieldset legend="Address"
            ><Input bind:value={$routeStates[$page.url.pathname].Shipper.AddressLine} /></Fieldset
          >
          <Fieldset legend="ZIP"
            ><Input
              type="number"
              bind:value={$routeStates[$page.url.pathname].Shipper.PostalCode}
              on:change={() => zipChangeHandler('shipper')}
            /></Fieldset
          >
          <Fieldset legend="City"
            ><Input bind:value={$routeStates[$page.url.pathname].Shipper.City} /></Fieldset
          >
          <Fieldset legend="State"
            ><Select
              options={stateOptions}
              bind:value={$routeStates[$page.url.pathname].Shipper.StateProvinceCode}
            /></Fieldset
          >
        </div>
        <div class="flex flex-col space-y-[1rem]">
          <H6>Ship To</H6>
          <Fieldset legend="Address"
            ><Input bind:value={$routeStates[$page.url.pathname].ShipTo.AddressLine} /></Fieldset
          >
          <Fieldset legend="ZIP"
            ><Input
              type="number"
              bind:value={$routeStates[$page.url.pathname].ShipTo.PostalCode}
              on:change={() => zipChangeHandler('shipTo')}
            /></Fieldset
          >
          <Fieldset legend="City"
            ><Input bind:value={$routeStates[$page.url.pathname].ShipTo.City} /></Fieldset
          >
          <Fieldset legend="State"
            ><Select
              options={stateOptions}
              bind:value={$routeStates[$page.url.pathname].ShipTo.StateProvinceCode}
            /></Fieldset
          >
        </div>
        <div class="flex flex-col space-y-[1rem]">
          <H6>Package Info</H6>
          <Fieldset legend="Total Packages"
            ><Input
              class="text-right"
              type="number"
              bind:value={$routeStates[$page.url.pathname].PackageInfo.Packages}
            /></Fieldset
          >
          <Fieldset legend="Total Weight"
            ><Input
              class="text-right"
              type="number"
              bind:value={$routeStates[$page.url.pathname].PackageInfo.Weight}
            /></Fieldset
          >
        </div>
      </div>
      <div
        class="flex flex-col space-y-[.5rem] lg:flex-row lg:space-y-0 lg:space-x-[.5rem] lg:self-end"
      >
        <Button class="{$theme.buttonSecondary} " on:click={nonValidatedRate} type="button">
          Non-Validated Rate
        </Button>
        <Button type="submit">Validated Rate</Button>
      </div>
    </Form>
  </div>
</div>

<Modals bind:modal />
