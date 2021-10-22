<script>
  // _imports
  import { onMount } from 'svelte';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js'
  import auth from "$lib/auth";
  import { getDirectReportUsers } from '$lib/user';
  import moment from 'moment';

  // components
  import { Card, Checkbox, Input, Section, Select, Spinner, Table } from '$components';

  // handlers
  const dateChangeHandler = async () => {
    const query = {
      from: moment(date, 'MM.DD.YYYY').startOf('day').format('x'),
      to: moment(date, 'MM.DD.YYYY').endOf('day').format('x'),
    }
    const { rows } = await serverFetch(`/api/covid/daily-questionnaire/date-range?${objectToUrlQueryParams(query)}`);
    tableRows = [...users].map(user=>{
      user.status = 'Unsubmitted';
      const matchingUser = [...rows].filter(submission=>submission.userId === user._id);
      if ( matchingUser.length > 1 ) user.status = matchingUser[matchingUser.length-1].approved ? 'Approved' : 'Unapproved';
      return user;
    })
  }

  // props ( internal )
  const cellClasses = 'p-[10px]';
  let date = moment().format('MM.DD.YYYY');
  let loaded = false;
  let tableRows;
  const viewOptions = [
    {value: 'Daily', label: 'Daily'},
    {value: 'Employee', label: 'Employee'},
  ]
  let viewValue = 'Daily';
  let users = [];

  onMount(async()=>{
    users = await getDirectReportUsers();
    await dateChangeHandler();

    loaded = true
  })
</script>

<Section>
  <Card class="items-center space-y-[2rem]">
    {#if loaded}
      <div class="w-full flex justify-between lg:justify-start lg:space-x-[1rem]">
        <!-- <Select label="View" options={viewOptions} bind:value={viewValue} class="flex-grow-0" /> -->
        {#if viewValue === 'Daily'}
          <Input type="date" on:change={dateChangeHandler} label="Date" bind:value={date} />
        {/if}
      </div>
      <Table width="">
        <thead slot="thead">
          <th class="{cellClasses}"></th>
          <th class="{cellClasses}">First</th>
          <th class="{cellClasses}">Last</th>
          <th class="{cellClasses}">Status</th>
        </thead>
        <tbody slot="tbody">
          {#each tableRows as row}
            <tr class="rounded transition duration-200 bg-white bg-opacity-0 hover:bg-opacity-[2%]">
              <td class="{cellClasses}"><Checkbox /></td>
              <td class="{cellClasses}">{row.firstName}</td>
              <td class="{cellClasses}">{row.lastName}</td>
              <td class="{cellClasses} {row.status === 'Approved' ? 'text-green-500' : row.status === 'Unsubmitted' ? 'text-warning-500' : 'text-red-500'}">{row.status}</td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {:else}
      <Spinner />
    {/if}
  </Card>
</Section>