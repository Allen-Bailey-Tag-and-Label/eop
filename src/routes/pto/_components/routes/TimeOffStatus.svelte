<script>
  // _imports
  import moment from 'moment';
  import { onMount } from 'svelte';
  import { serverFetch } from '$lib/_helpers';
  import { grow, shrink } from '$lib/_transitions';
  import { getDirectReportUsers, getSelf } from '$lib/user';
  import { modal } from '$stores';
  import { getPTORequests } from '../../_utilities';

  // components
  import { Buttons, Card, Checkbox, Container, Input, Modal as Modals, Section, Select, Spinner, Table } from '$components';
  const { default : Modal } = Modals;
  import Icon, { Adjustments, ChevronDown, ChevronUp, Trash } from 'svelte-hero-icons';

  // handlers
  const deleteClickHandler = async () => {
    const confirmFn = async () => {
      // show spinner modal
      modal.spinner.show();

      try {
        await Promise.all(checkedRows.map(async ({_id}) => {
          await serverFetch({
            method: 'DELETE',
            href: `/api/datatable/pto-requests?_id=${_id}`
          })
        }))
        updateRequests();
        modal.success.show('Successfully deleted PTO requests');
      } catch(error) {
        modal.error.show(error);
      }

      // hide spinner modal
      modal.spinner.hide();
    }
    modal.confirmation.show(`Are you sure you want to delete ${checkedRows.length} request${checkedRows.length !== 1 ? 's' : ''}?`, confirmFn);
  }
  const filterClickHandler = () => show = !show;
  const statusChangeHandler = async (e, _id) => {
    // initate status variable
    const status = e.target.value;

    await updateStatus([{_id, status}])
  }
  const thClickHandler = key => {
    if ( sort.key === key ) return sort.direction *= -1;
    sort.key = key;
    sort.direction = 1;
  }

  // utilities
  const rowFilter = pto => {
    // filter based on date
    if ( filter.value.date === 'Past' && +pto.start >= moment().startOf('day').format('x') ) return false;
    if ( filter.value.date === 'Range' && (+pto.start < +moment(filter.value.dateStart, 'MM.DD.YYYY').format('x') || +pto.start > +moment(filter.value.dateEnd, 'MM.DD.YYYY').format('x'))) return false;
    if ( filter.value.date === 'Upcoming' && +pto.start < moment().startOf('day').format('x')) return false;

    // filter based on request type
    for( let i = 0 ; i < filter.options.requests.length; i++ ) {
      const request = filter.options.requests[i];
      if ( request.checked === false && pto.reason === request.label ) return false;
    }

    // filter based on status
    for( let i = 0 ; i < filter.options.status.length; i++ ) {
      const status = filter.options.status[i];
      if ( status.checked === false && pto.status === status.label ) return false;
    }
    return true;
  }
  const rowMap = pto => {
    const start = moment(pto.start, 'x');
    const end = moment(pto.end, 'x');
    const checked = false;
    const hours = pto.reason === 'Floating Holiday' ? 8 : end.diff(start, 'days') < 1 ? end.diff(start,'hours') : end.diff(start,'days') * 8;
    const duration = hours < 8 ? hours + ` hour${hours !== 1 ? 's' : ''}` : hours / 8 + ` day${hours/8 !== 1 ? 's' : ''}`
    pto = { ...pto, checked, duration, hours };
    return pto;
  }
  const rowSort = (a,b) => {
    a = a[sort.key]; b = b[sort.key];
    if ( a < b ) return sort.direction * -1;
    if ( a > b ) return sort.direction;
    return 0;
  }
  const updateRequests = async () => {
    // reset tbody;
    tbody.upcoming = [];

    // get PTO requests
    rows = await getPTORequests(user);

    // add common logic to requests
    rows = rows.map(rowMap);
  }
  const updateStatus = async statuses => {
    // show spinner modal
    modal.spinner.show();
    try {
      await Promise.all(statuses.map(async ({_id, status}) => {
        await serverFetch({
          method: 'PATCH',
          href: `/api/datatable/pto-requests?_id=${_id}`,
          body: {
            status
          }
        })
      }))

      modal.success.show(`Successfully updated status${statuses.length !== 1 ? 's' : '' }`);
    } catch ( error ) {
      modal.error.show(error)
    }

    // hide spinner modal
    modal.spinner.hide();
  }
  const updateUsers = async () => {
    const rows = await getDirectReportUsers();
    users = rows.map(row=>{
      return { label: `${row.firstName} ${row.lastName}`, value: `${row._id}` }
    });
    if ( admin ) users = [{label: 'All', value: 'All'}, ...users]
    self = await getSelf();
    user = self._id;
  }
  
  // props ( internal )
  const cellClasses = 'p-[10px] whitespace-nowrap'
  let loaded = false;
  let filter = {
    options: {
      date: [
        {label: 'All', value: 'All'},
        {label: 'Past', value: 'Past'},
        {label: 'Range', value: 'Range'},
        {label: 'Upcoming', value: 'Upcoming'},
      ],
      requests: [
        { checked: true, label: 'Bereavement' },
        { checked: true, label: 'Floating Holiday' },
        { checked: true, label: 'Scheduled Paid Time Off' },
      ],
      status: [
        { checked: true, label: 'Approved' },
        { checked: true, label: 'Denied' },
        { checked: true, label: 'Submitted' },
      ]
    },
    value: {
      date: 'Upcoming',
      dateStart: moment().format('MM.DD.YYYY'),
      dateEnd: moment().format('MM.DD.YYYY'),
    }
  }
  let rows = [];
  let self;
  let show = false;
  const sort = {
    direction: 1,
    key: 'start'
  }
  const statusOptions = [
    { label: 'Approved', value: 'Approved' },
    { label: 'Denied', value: 'Denied' },
    { label: 'Submitted', value: 'Submitted' },
  ]
  const table = {
    thead: [
      { label: '', key: 'checked' },
      { label: 'Date', key: 'start' },
      { label: 'Request', key: 'reason' },
      { label: 'Duration', key: 'hours' },
      { label: 'Status', key: 'status' },
    ]
  }
  let tbody = [];
  let user = '';
  let users = [];

  // props ( external )
  export let admin = false;

  // props ( dynamic )
  $: if ( user ) updateRequests();
  $: if ( sort && filter ) {
    tbody = [...rows].sort(rowSort).filter(rowFilter);
  }
  $: checkedRows = [...tbody].filter(pto=>pto.checked)

  // lifcycle
  onMount(async()=>{
    await updateUsers();
    await updateRequests();
    loaded = true;
  })
</script>

<Section>
  {#if loaded}
    <Card class="space-y-[1rem]">
      <div class="flex justify-between items-center space-x-[.5rem]">
        {#if admin}
          <Select options={users} bind:value={user} />
        {:else}
          <div />
        {/if}
        <div class="flex space-x-[.5rem]">
          <Buttons.Icon on:click={filterClickHandler}><Icon src={Adjustments} class="w-[24px] h-[24px]" /></Buttons.Icon>
          {#if checkedRows.length > 0}
            <div in:grow out:shrink class="flex">
              <Buttons.Icon on:click={deleteClickHandler} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
            </div>
          {/if}
        </div>
      </div>
      <Table width="w-full md:w-auto">
        <thead slot="thead">
          {#each table.thead as {label, key}}
            <th class="{cellClasses} cursor-pointer" on:click={()=>thClickHandler(key)}>
              <div class="flex space-x-[.5rem] items-center justify-center">
                <div>{label}</div>
                {#if sort.key === key}
                  <Icon src={sort.direction === 1 ? ChevronDown : ChevronUp} class="w-[12px] h-[12px]" />
                {/if}
              </div>
            </th>
          {/each}
        </thead>
        <tbody slot="tbody">
          {#each tbody as {_id, userId, checked, start, reason, duration, status}}
            <tr>
              <td class="{cellClasses}">
                {#if status === 'Submitted'}
                  <Checkbox bind:checked />
                {/if}
              </td>
              <td class="{cellClasses} text-right">{moment(start, 'x').format('MM.DD.YYYY')}</td>
              <td class="{cellClasses}">{reason}</td>
              <td class="{cellClasses}">{duration}</td>
              <td class="{cellClasses}">
                {#if admin && userId !== self._id}
                  <Select on:change={e=>statusChangeHandler(e, _id)} options={statusOptions} bind:value={status} />
                {:else}
                  {status}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </Table>
    </Card>
  {:else}
    <Card>
      <Spinner/>
    </Card>
  {/if}
</Section>

<Modal bind:show>
  <Container class="flex justify-center pointer-events-none">
    <Card class="transition duration-200 space-y-[1rem] {show?'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none'}">
      <Select options={filter.options.date} bind:value={filter.value.date} label="Date" />
      {#if filter.value.date === 'Range'}
        <Input label="Start" type="date" bind:value={filter.value.dateStart} />
        <Input label="End" type="date" bind:value={filter.value.dateEnd} />
      {/if}
      <div class="flex flex-col space-y-[.5rem] items-start">
        <div class="transform scale-[.9]">Request</div>
        {#each filter.options.requests as {checked, label}}
          <div class="flex space-x-[.5rem]">
            <Checkbox bind:checked />
            <div class="whitespace-nowrap">{label}</div>
          </div>
        {/each}
      </div>
      <div class="flex flex-col space-y-[.5rem] items-start">
        <div class="transform scale-[.9]">Status</div>
        {#each filter.options.status as {checked, label}}
          <div class="flex space-x-[.5rem]">
            <Checkbox bind:checked />
            <div class="whitespace-nowrap">{label}</div>
          </div>
        {/each}
      </div>
    </Card>
  </Container>
</Modal>