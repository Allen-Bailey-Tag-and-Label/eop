<script>
  // _imports
  import moment from 'moment';
  import { onMount } from 'svelte';
  import { serverFetch } from '$lib/_helpers'
  import auth from '$lib/auth';
  import { modal } from '$stores';
  import { getPTORequests } from '../_utilities';

  // components
  import { Button, Card, Input, Section, Select, Spinner, Table } from '$components';

  // utilities
  const updateRequests = async () => {
    // get PTO requests
    const rows = await getPTORequests();

    // get dates
    const year = +moment().format('YY');
    const start = {
      floatingHoliday: moment(`01.01.${year}`, 'MM.DD.YYYY').format('x'),
      pto: moment(`05.01.${year - (+moment().format('M') < 5 ? 1 : 0)}`, 'MM.DD.YYYY').format('x')
    };
    const end = {
      floatingHoliday: moment(`12.31.${year}`, 'MM.DD.YYYY').format('x'),
      pto: moment(`04.30.${year - (+moment().format('M') < 5 ? 1 : 0) + 1}`, 'MM.DD.YYYY').format('x')
    };

    // initiate floating holiday
    floatingHoliday = 'Not Scheduled';

    // filter requests
    const requests = rows.filter(pto => {
      if ( +pto.start >= start.floatingHoliday && +pto.end <= end.floatingHoliday && pto.reason === 'Floating Holiday' ) floatingHoliday = moment(pto.start, 'x').format('MM.DD.YYYY')
      return +pto.start >= start.pto && +pto.end <= end.pto && pto.reason === 'Scheduled Paid Time Off'
    });

    // calculate total time requested
    const totalTime = requests.reduce((total, {start, end}) => {
      start = moment(start, 'x');
      end = moment(end, 'x');
      const diff = end.diff(start, 'days') < 1 ? end.diff(start, 'hours') : end.diff(start, 'days') * 8
      total += diff;
      return total
    }, 0)

    availableHours = 200 - totalTime;
  }

  // handlers
  const reasonChangeHandler = () => {
    if ( reason !== 'Scheduled Paid Time Off') request = 0;
  }
  const submitHandler = async () => {
    let error = undefined;
    // check if requesting 0 hours
    if ( reason === 'Scheduled Paid Time Off' && request <= 0 ) error = 'Please enter valid request amount.';

    // check if remaining less than 0
    if ( remainingHours < 0 ) {
      request = 0;
      return;
    }

    // check if request is in past
    if ( moment(date, 'MM.DD.YYYY').format('x') < moment().startOf('day').format('x')) error = 'Cannot enter past dates.'

    if (error) return modal.error.show(error)

    // show modal
    modal.spinner.show();

    // get dates
    const start = moment(date, 'MM.DD.YYYY').format('x');
    const end = moment(date, 'MM.DD.YYYY').add(reason === 'Bereavement' ? bereavementDays : request, reason === 'Bereavement' ? 'days' : requestPeriod === 'Days' ? 'days' : 'hours').format('x');

    try {
      // create post body
      const body = {
        auth: $auth,
        end,
        reason,
        start,
        status: 'Submitted',
      }

      // upload to database
      await serverFetch({
        method: 'POST',
        href: '/api/datatable/pto-requests',
        body
      })

      // update PTO requests
      await updateRequests();

      // reset request
      request = 0
      reason = reason === 'Floating Holiday' ? 'Scheduled Paid Time Off' : reason

      // show success modal
      modal.success.show( 'Successfully submitted PTO request')
    } catch (error) {
      modal.error.show(error);
    }

    // hide modal
    modal.spinner.hide();
  }

  // props ( internal )
  let availableHours = 200;
  const cellClasses = 'p-[10px] whitespace-nowrap';
  let date = moment().format('MM.DD.YYYY');
  let floatingHoliday = 'Not Scheduled'
  let loaded = false;
  let request = 0;
  const requestOptions = [
    {label: 'Days', value: 'Days'},
    {label: 'Hours', value: 'Hours'},
  ]
  let reason = 'Scheduled Paid Time Off';
  let relationship = 'Parent';
  const relationshipOptions = [
    { days: 3, label: 'Brother', value: 'Brother' },
    { days: 1, label: 'Brother-in-law', value: 'Brother-in-law' },
    { days: 3, label: 'Daughter', value: 'Daughter' },
    { days: 3, label: 'Daughter-in-law', value: 'Daughter-in-law' },
    { days: 3, label: 'Grandchild', value: 'Grandchild' },
    { days: 1, label: 'Grandparent', value: 'Grandparent' },
    { days: 1, label: 'Grandparent-in-law', value: 'Grandparent-in-law' },
    { days: 3, label: 'Parent', value: 'Parent' },
    { days: 3, label: 'Sister', value: 'Sister' },
    { days: 1, label: 'Sister-in-law', value: 'Sister-in-law' },
    { days: 3, label: 'Son', value: 'Son' },
    { days: 3, label: 'Son-in-law', value: 'Son-in-law' },
    { days: 3, label: 'Spouse', value: 'Spouse' },
    { days: 3, label: 'Spouse\'s Parent', value: 'Spouse\'s Parent' },
  ]
  let requestPeriod = 'Days';

  // props ( external )

  // props ( dynamic )
  $: requestMax = requestPeriod === 'Hours' ? Math.min(8, availableHours) : Math.floor(availableHours / 8);
  $: bereavementDays = [...relationshipOptions].filter(obj=>obj.value === relationship)[0].days
  $: requestHours = requestPeriod === 'Hours' ? +request : +request * 8;
  $: remainingHours = availableHours - (reason === 'Scheduled Paid Time Off' ? requestHours : 0 );
  $: reasonOptions = floatingHoliday === 'Not Scheduled' ? [
    { label: 'Bereavement', value: 'Bereavement' },
    { label: 'Floating Holiday', value: 'Floating Holiday' },
    { label: 'Scheduled Paid Time Off', value: 'Scheduled Paid Time Off' },
  ] : [
    { label: 'Bereavement', value: 'Bereavement' },
    { label: 'Scheduled Paid Time Off', value: 'Scheduled Paid Time Off' },
  ]

  // lifecycle
  onMount(async()=> {
    await updateRequests();
    loaded = true;  
  })
</script>

<Section class="space-y-[1rem] md:items-start lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
  {#if loaded}
    <Card>
      <div class="font-bold">Hours</div>
      <Table width="w-full md:w-auto">
        <tbody slot="tbody">
          <tr>
            <td class="{cellClasses}">Available:</td>
            <td class="{cellClasses} text-right">{availableHours}</td>
          </tr>
          <tr>
            <td class="{cellClasses}">Requesting:</td>
            <td class="{cellClasses} text-right">{requestHours}</td>
          </tr>
          <tr>
            <td class="{cellClasses}">Remaining:</td>
            <td class="{cellClasses} text-right">{remainingHours}</td>
          </tr>
          <tr>
            <td class="{cellClasses}">Floating Holiday:</td>
            <td class="{cellClasses} text-right">{floatingHoliday}</td>
          </tr>
        </tbody>
      </Table>
    </Card>
    <Card class="space-y-[1rem] md:items-start">
      <Select bind:value={reason} bind:options={reasonOptions} on:change={reasonChangeHandler} label="Reason" />
      {#if reason === 'Bereavement'}
        <div class="flex space-x-[1rem] items-end">
          <Select bind:value={relationship} options={relationshipOptions} label="Relationship" />
          <Input label="Days" readonly={true} bind:value={bereavementDays} width="w-[70px]" />
        </div>
        {:else if reason === 'Scheduled Paid Time Off'}
        <div class="grid grid-cols-2 gap-[1rem] md:flex md:space-x-[1rem]">
          <Input type="number" label="Request" bind:max={requestMax} bind:value={request} width="w-[100px]" />
          <Select label="Period" options={requestOptions} bind:value={requestPeriod} />
        </div>
      {/if}
      <Input bind:value={date} type="date" label="Start Date" />
      <Button on:click={submitHandler} class="w-full md:w-auto md:self-end">Submit</Button>
    </Card>
  {:else}
    <Card>
      <Spinner />
    </Card>
  {/if}
</Section>