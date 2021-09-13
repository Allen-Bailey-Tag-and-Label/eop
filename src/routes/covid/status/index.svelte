<script>
  // _imports
  import { onMount } from 'svelte';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js'
  import moment from 'moment';

  // components
  import { Card, Input, Section, Select, Spinner, Table } from '$components';

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
      if ( matchingUser.length === 1 ) user.status = matchingUser[0].approved ? 'Approved' : 'Unapproved';
      return user;
    })
  }

  // props ( internal )
  let date = moment().format('MM.DD.YYYY');
  let loaded = false;
  let tableRows;
  const viewOptions = [
    {value: 'Daily', label: 'Daily'},
    {value: 'Employee', label: 'Employee'},
  ]
  let viewValue = 'Daily';
  let users;

  onMount(async()=>{
    const data = await serverFetch(`/api/datatable/users?sort=${JSON.stringify({ firstName: 1, lastName: 1 })}`);
    users = data.rows;
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
      <Table>
        <thead slot="thead">
          <th class="p-[10px]">First</th>
          <th class="p-[10px]">Last</th>
          <th class="p-[10px]">Status</th>
        </thead>
        <tbody slot="tbody">
          {#each tableRows as row}
            <tr class="rounded transition duration-200 bg-white bg-opacity-0 hover:bg-opacity-[2%]">
              <td class="p-[10px]">{row.firstName}</td>
              <td class="p-[10px]">{row.lastName}</td>
              <td class="p-[10px] {row.status === 'Approved' ? 'text-green-500' : 'text-red-500'}">{row.status}</td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {:else}
      <Spinner />
    {/if}
  </Card>
</Section>