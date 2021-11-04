<script>
  // _imports
  // import { page } from '$app/stores';
  import { serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  import { getDirectReportUsers } from '$lib/user';
  import moment from 'moment';
  import { onMount } from 'svelte';
  import { downloadCSV } from '../_utilities';
  
  // components
  import { Buttons, Card, Checkbox, Section, Spinner, Table } from '$components';
  import Icon, {Download, Pencil, Trash} from 'svelte-hero-icons';
  
  // handlers
  const deleteClickHandler = pcr => {
    const confirmFn = async () => {
      modal.spinner.show();
      await serverFetch({
        method: 'DELETE',
        href: `/api/datatable/pay-change-requests?_id=${pcr._id}`,
        body: {}
      });
      await getPayChangeRequests();
      modal.spinner.hide();
    }
    modal.confirmation.show(`Are you sure you want to delete the pay change request for "${pcr.firstName} ${pcr.lastName}" effective ${moment(pcr.change.date, 'x').format('MM.DD.YYYY')}?`, confirmFn)
  }
  const downloadClickHandler = async pcr => {
    modal.spinner.show();
    try {
      console.log(pcr)
      await downloadCSV(pcr);
    } catch( error ) {
      modal.error.show(error);
    }
    modal.spinner.hide();
  }
  const getPayChangeRequests = async () => {
    const sort = {
      'change.date' : -1
    }
    const { rows } = await serverFetch(`/api/datatable/pay-change-requests?sort=${JSON.stringify(sort)}`)
    pcrs = rows.filter(pcr=>
      [...users].filter(user=>user._id === pcr.userId).length > 0
    )
    .map(obj=>{
      const user = [...users].filter(user=>user._id === obj.userId)[0];
      obj = {
        ...obj, 
        firstName: user.firstName, 
        lastName: user.lastName,
        ennisId: user.ennisId, 
        hireDate: user.hireDate,
      };
      return obj;
    });
  }
  
  // props ( internal )
  let loaded = false;
  let pcrs = [];
  let users = [];
  
  // props ( external )
  
  // props ( dynamic )
  
  // stores
  import { modal } from '$stores';
  
  onMount(async() => {
    users = await getDirectReportUsers();
    await getPayChangeRequests();
    loaded = true;
  })
</script>

<Section>
  {#if loaded}
    <Table width="">
      <thead slot="thead">
        <!-- <th><Checkbox /></th> -->
        <th>Employee</th>
        <th>Effective Date</th>
        <th>Status</th>
        <th>Options</th>
      </thead>
      <tbody slot="tbody">
        {#each pcrs as pcr }
          <tr>
            <!-- <td><Checkbox /></td> -->
            <td>{pcr.firstName} {pcr.lastName}</td>
            <td class="text-center">{moment(pcr.change.date, 'x').format('MM.DD.YYYY')}</td>
            <td class="text-center">{pcr.status}</td>
            <td class="text-center">
              <div class="flex space-x-[.5rem]">
                <Buttons.Icon on:click={()=>downloadClickHandler(pcr)} theme="success"><Icon src={Download} class="w-[24px] h-[24px]"/></Buttons.Icon>
                {#if pcr.status !== 'Approved'}
                  <Buttons.Icon type="link" href="/pcr/submit?_id={pcr._id}" theme="secondary"><Icon src={Pencil} class="w-[24px] h-[24px]"/></Buttons.Icon>
                  <Buttons.Icon on:click={()=>deleteClickHandler(pcr)} theme="error"><Icon src={Trash} class="w-[24px] h-[24px]"/></Buttons.Icon>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </Table>
  {:else}
    <div class="h-full min-h-full flex items-center justify-center">
      <Card>
        <Spinner />
      </Card>
    </div>
  {/if}
</Section>