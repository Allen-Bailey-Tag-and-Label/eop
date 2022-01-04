<script>
  // _imports
  import moment from 'moment';
  import { onMount } from 'svelte';
  import { objectToUrlQueryParams, serverFetch } from '$lib/_helpers.js'
  import { getDirectReportUsers } from '$lib/user';
  import { modal } from '$stores';
  import immunizationOptions from './immunizationOptions';

  // components
  import { Card, Checkbox, Input, Section, Select, Spinner, Table } from '$components';

  // handlers
  const getUsers = async () => {
    const directReportUsers = await getDirectReportUsers();
    users = directReportUsers
  }
  const getVaccinations = async () => {
    const { rows } = await serverFetch('/api/datatable/vaccine-status');
    rows.forEach(user=>{
      vaccinations[user.userId] = user;
    })
  }
  const mapUsersVaccinations = async () => {
    await Promise.all(users.map(async user=>{
      if ( !(user._id in vaccinations) ) {
        const body = {
          userId: user._id,
          immunizationMethod: 'Unknown',
          dateFirstShot: '',
          dateSecondShot: '',
          dateBooster: '',
        }
        await serverFetch({
          method: 'POST',
          href: '/api/datatable/vaccine-status',
          body
        });
        vaccinations[user._id] = body;
      }
      const tr = {
        userId : user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        immunizationMethod: vaccinations[user._id].immunizationMethod,
        dateFirstShot: vaccinations[user._id].dateFirstShot === '' ? vaccinations[user._id].dateFirstShot : moment(vaccinations[user._id].dateFirstShot, 'x').format('MM.DD.YYYY'),
        dateSecondShot: vaccinations[user._id].dateSecondShot === '' ? vaccinations[user._id].dateSecondShot : moment(vaccinations[user._id].dateSecondShot, 'x').format('MM.DD.YYYY'),
        dateBooster: vaccinations[user._id].dateBooster === '' ? vaccinations[user._id].dateBooster : moment(vaccinations[user._id].dateBooster, 'x').format('MM.DD.YYYY'),
      }
      tbody = [...tbody, tr]
    }))
  }
  const updateVaccinationStatus = async ( e, userId, i, field ) => {
    modal.spinner.show();
    try {
      const body = {};
      if ( field === 'dateFirstShot' || field === 'dateSecondShot' || field === 'dateBooster' ) {
        body[field] = e?.detail?.value !== undefined ? moment(e.detail.value, 'MM.DD.YYYY').format('x') : '';
      } else {
        body[field] = e.target.value;
      }
      await serverFetch({
        method: 'PATCH',
        href: `/api/datatable/vaccine-status?userId=${userId}`,
        body
      })
      if ( field === 'dateFirstShot' || field === 'dateSecondShot' || field === 'dateBooster' ) {
        tbody[i][field] = e?.detail?.value !== undefined ? moment(body[field], 'x').format('MM.DD.YYYY') : '';
      } else {
        tbody[i][field] = body[field];
      }
    } catch (error) {
      modal.error.show(error);
    }
    modal.spinner.hide();
  }

  // props ( internal )
  const cellClasses = 'p-[10px] whitespace-nowrap';
  let loaded = false;
  let tbody = [];
  let users = [];
  let vaccinations = {};

  // props ( external )

  // props ( dynamic )
  $: total = [...immunizationOptions].reduce((obj, option) => {
    obj[option.value] = [...tbody].filter(({immunizationMethod, dateFirstShot, dateSecondShot}) => {
      if ( immunizationMethod !== option.value ) return false;
      if ( dateFirstShot === '' && option.firstShot ) return false;
      if ( dateSecondShot === '' && option.secondShot ) return false;
      return true;
    }).length
    return obj;
  }, {'Employees' : [...tbody].length})

  // lifecycle
  onMount(async ()=>{
    await Promise.all([getVaccinations(), getUsers()]);
    await mapUsersVaccinations();
    loaded = true;
  });
</script>

<Section class="space-y-[1rem]">
  {#if loaded}
    <Card>
      <Table width="">
        <thead slot="thead" />
        <tbody slot="tbody">
          {#each Object.keys(total) as key}
            <tr>
              <td class="{cellClasses}">{key}</td>
              <td class="{cellClasses} text-right">{total[key]}</td>
            </tr>
          {/each}
        </tbody>
      </Table>
    </Card>
    <Card class="items-center space-y-[2rem]">
      <Table width="">
        <thead slot="thead">
          <th class="{cellClasses}">First</th>
          <th class="{cellClasses}">Last</th>
          <th class="{cellClasses}">Immunization Method</th>
          <th class="{cellClasses} w-[165px] text-center">Date ( First Shot )</th>
          <th class="{cellClasses} w-[165px]">Date ( Second Shot )</th>
          <th class="{cellClasses} w-[165px]">Date ( Booster )</th>
        </thead>
        <tbody slot="tbody">
          {#each tbody as {userId, firstName, lastName, immunizationMethod, dateFirstShot, dateSecondShot, dateBooster}, i}
            <tr>
              <td class="{cellClasses}">{firstName}</td>
              <td class="{cellClasses}">{lastName}</td>
              <td class="{cellClasses}">
                {#if [...immunizationOptions].map(obj=>obj.value).includes(immunizationMethod)}
                  <Select on:change={e=>updateVaccinationStatus(e,userId,i,'immunizationMethod')} options={[...immunizationOptions, {label:'Other', value: ''}]} value={immunizationMethod} />
                {:else}
                  <Input value={immunizationMethod} on:change={e=>updateVaccinationStatus(e,userId,i,'immunizationMethod')} />
                {/if}
                </td>
              <td class="{cellClasses} text-center">
                {#if [...immunizationOptions].filter(obj=>obj.firstShot).map(obj=>obj.value).includes(immunizationMethod)}
                  <Input type="date" value={dateFirstShot} on:change={e=>updateVaccinationStatus(e,userId,i,'dateFirstShot')} />
                {/if}
              </td>
              <td class="{cellClasses} text-center">
                {#if [...immunizationOptions].filter(obj=>obj.secondShot).map(obj=>obj.value).includes(immunizationMethod)}
                  <Input type="date" value={dateSecondShot} on:change={e=>updateVaccinationStatus(e,userId,i,'dateSecondShot')} />
                {/if}
              </td>
              <td class="{cellClasses} text-center">
                {#if [...immunizationOptions].filter(obj=>obj.booster).map(obj=>obj.value).includes(immunizationMethod)}
                  <Input type="date" value={dateBooster} on:change={e=>updateVaccinationStatus(e,userId,i,'dateBooster')} />
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </Table>
    </Card>
  {:else}
    <Card class="items-center space-y-[2rem]">
      <Spinner />
    </Card>
  {/if}
</Section>