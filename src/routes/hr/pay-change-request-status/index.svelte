<script>
  // _imports
  // import { page } from '$app/stores';
  import { serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  import { getDirectReportUsers } from '$lib/user';
  import Excel from 'exceljs';
  import * as FileSaver from 'file-saver';
  import moment from 'moment';
  import { onMount } from 'svelte';
  
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
      const wb = new Excel.Workbook();
      const data = await serverFetch('/api/excel-template/pay-change-request-form')
      const workbook = await wb.xlsx.load(data.data);
      const worksheet = workbook.getWorksheet('Pay Change Request');

      // update worksheet heights
      const rows = [2,5,7,12,15,22,25,27,28,30,32,35,36,38,39,40,41,42,43,45,49,50,52,53,55,56,57,59,62,65,66]
      rows.forEach(row=>{
        worksheet.getRow(row).height = 12.75
      });

      // update individual cells
      worksheet.getCell('F2').font ={ name: 'Arial', size:10}
      worksheet.getCell('B7').font ={ name: 'Arial', size:10}
      worksheet.getCell('A9').value = 'Allen-Bailey Tag & Label';
      worksheet.getCell('E9').value = '2049';
      worksheet.getCell('H9').value = pcr.costCenter;
      worksheet.getCell('J9').value = pcr.ennisId;
      worksheet.getCell('B12').value = pcr.lastName;
      worksheet.getCell('E12').value = pcr.firstName;
      worksheet.getCell('J12').value = moment(pcr.hireDate, 'x').format('M/D/YYYY');
      worksheet.getCell('A15').value = pcr.title;
      worksheet.getCell('E15').value = pcr.jobCode;
      worksheet.getCell('H15').value = pcr.eeoClassification;
      worksheet.getCell('J15').value = pcr.workCompClass;
      if ( 'previous' in pcr ) {
        worksheet.getCell('A22').value = moment(pcr.previous.date, 'x').format('M/D/YYYY');
        worksheet.getCell('E22').value = pcr.previous.previous;
        worksheet.getCell('H22').value = pcr.previous.after;
        worksheet.getCell('J22').value = { formula: '(H22/E22)-1', result: pcr.previous.percent/100}
        worksheet.getCell('C25').value = pcr.previous.code;
        worksheet.getCell('E25').value = pcr.previous.description;
        worksheet.getCell('C27').value = pcr.previous.explanation;
      }
      worksheet.getCell('A36').value = moment(pcr.change.date, 'x').format('M/D/YYYY');
      worksheet.getCell('E36').value = pcr.change.previous;
      worksheet.getCell('H36').value = pcr.change.after;
      worksheet.getCell('J36').value = { formula: '(H36/E36)-1', result: pcr.change.percent/100}
      worksheet.getCell('C39').value = pcr.change.code;
      worksheet.getCell('E39').value = pcr.change.description;
      worksheet.getCell('C42').value = pcr.change.explanation;
      
      // write file to buffer
      const buffer = await wb.xlsx.writeBuffer({base64:true})

      // create blob for saving
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      // save file
      FileSaver.saveAs(blob, `pcr-${pcr.firstName.toLowerCase()}-${pcr.lastName.toLowerCase()}-${moment(pcr.change.date, 'x').format('MM-DD-YYYY')}.xlsx`)
    } catch( error) {
      console.log(error)
    }
    modal.spinner.hide();
  }
  const getPayChangeRequests = async () => {
    const sort = {
      'change.date' : -1
    }
    const { rows } = await serverFetch(`/api/datatable/pay-change-requests?sort=${JSON.stringify(sort)}`)
    pcrs = rows.map(obj=>{
      const user = [...users].filter(user=>user._id === obj.userId)[0];
      obj = {
        ...obj, 
        firstName: user.firstName, 
        lastName: user.lastName,
        ennisId: user.ennisId, 
        hireDate: user.hireDate,
        title: user.title,
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
                  <Buttons.Icon type="link" href="/hr/submit-pay-change-request?_id={pcr._id}" theme="secondary"><Icon src={Pencil} class="w-[24px] h-[24px]"/></Buttons.Icon>
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