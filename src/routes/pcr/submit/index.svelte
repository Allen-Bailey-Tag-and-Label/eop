<script context="module">
  export async function load({ page }) {
    // destructure page
    let { query } = page;

    // sanitize query
    query = Object.fromEntries(query);
    
    return {
      props : {
        query
      }
    }
  }
</script>
<script>
  // _imports
  // import { page } from '$app/stores';
  import { currencyFormat, serverFetch } from '$lib/_helpers.js';
  // import auth from '$lib/auth';
  import { getDirectReportUsers, getUsers } from '$lib/user';
  import moment from 'moment';
  import { onMount } from 'svelte';
  import changeCodes from './change-codes';
  
  // components
  import { Button, Card, Input, Section, Select, Spinner, Textarea } from '$components';
  
  // handlers
  const codeChangeHandler = () => change.description = changeCodes[change.code];
  const codeDescriptionChangeHandler = () => change.code = Object.keys(changeCodes).find(key => changeCodes[key] === change.description);
  const employeeChangeHandler = async () => {
    modal.spinner.show();
    if ( userId !== '' ) {
      user = [...users].filter(user=>user._id === userId)[0];
      change.exempt = user.exempt
      const sort = {
        date : -1
      }
      const { rows } = await serverFetch(`/api/datatable/pay-change-requests?userId=${userId}&sort=${JSON.stringify(sort)}`);
      if ( rows.length > 0 ) {
        const pcr = rows[0];
        previous = {
          after: currencyFormat(pcr.change.after),
          code: pcr.change.code,
          date: moment(pcr.change.date, 'x').format('MM.DD.YYYY'),
          description: pcr.change.description,
          exempt:  pcr.change.exempt,
          explanation: pcr.change.explanation,
          previous: currencyFormat(pcr.change.previous),
          percent: `${pcr.change.percent}%`,
        }

        // check for user exempt status
        if ( previous.exempt === true && change.exempt === false ) change.previous = currencyFormat(pcr.change.after / 2080);
        else if ( previous.exempt === false && change.exempt === true ) change.previous = currencyFormat(pcr.change.after * 2080);
        else change.previous = currencyFormat(pcr.change.after);
      } else {
        change.previous = '';
        previous = {
          after: '',
          code: '',
          date: '',
          description: '',
          exempt:  '',
          explanation: '',
          previous: '',
          percent: '',
        }
      }
    } else {
      user = undefined;
    }
    modal.spinner.hide();
  }
  const getPCR = async () => {
    const { rows } = await serverFetch(`/api/datatable/pay-change-requests?_id=${query._id}`)
    const pcr = rows[0];
    userId = pcr.userId;
    await employeeChangeHandler();
    previous = {
      after: currencyFormat(pcr.previous.after),
      code: pcr.previous.code,
      date: moment(pcr.previous.date, 'x').format('MM.DD.YYYY'),
      description: pcr.previous.description,
      exempt:  pcr.previous.exempt,
      explanation: pcr.previous.explanation,
      previous: currencyFormat(pcr.previous.previous),
      percent: `${pcr.previous.percent}%`,
    }
    change = {
      after: currencyFormat(pcr.change.after),
      code: pcr.change.code,
      date: moment(pcr.change.date, 'x').format('MM.DD.YYYY'),
      description: pcr.change.description,
      exempt:  pcr.change.exempt,
      explanation: pcr.change.explanation,
      previous: currencyFormat(pcr.change.previous),
      percent: `${pcr.change.percent}%`,
    }
  }
  const payChangeHandler = async () => {
    const after = +change.after.replace(/[\$\,]/g,'');
    const previous = +change.previous.replace(/[\$\,]/g,'');
    const percent = previous === 0 ? 0 : Math.round(((after / previous)-1)*1000) / 10;
    change.percent = `${percent}%`;
  }
  const percentChangeHandler = async () => {
    const previous = +change.previous.replace(/[\$\,]/g,'');
    const percent = +change.percent.replace(/\%/g,'');
    const after = currencyFormat(Math.round(previous * ( 1 + (percent/100) ) * 100) / 100);
    change.after = after
  }
  const reset = () => {
    change = {
      after: '$0.00',
      code: '',
      date: moment().endOf('week').add(15, 'days').format('MM.DD.YYYY'),
      description: '',
      exempt: undefined,
      explanation: '',
      previous: '$0.00',
      percent: '0.0%',
    }
    previous = {
      after: '',
      code: '',
      date: '',
      description: '',
      exempt: undefined,
      explanation: '',
      previous: '',
      percent: '',
    }
    user = undefined;
    userId = '';
  }
  const submitHandler = async () => {
    // check if code is not empty
    if ( change.code === '' ) return modal.error.show('Must include a valid change code and description.')

    // check if increase is over 2% and no explanation provided
    if ( +change.percent.replace(/\%/g,'') > 2 && change.explanation.replace(/\s/g,'') === '' ) return modal.error.show('Increases over 2.00% must have an explanation.')

    // check if increase is within 6 months and no explanation provided
    if ( moment(change.date, 'MM.DD.YYYY').diff(moment(previous.date, 'MM.DD.YYYY'), 'months') < 6 && change.explanation.replace(/\s/g,'') === '' ) return modal.error.show('Increase less than 6 months must have an explanation.')
    
    modal.spinner.show();

    // destructure user
    const { costCenter, jobCode, jobTitle, eeoClassification, workCompClass } = user;

    // initiate body
    const body = {
      userId : userId,
      costCenter,
      jobCode,
      jobTitle,
      eeoClassification,
      workCompClass,
      change: {
        ...change,
        date: moment(change.date, 'MM.DD.YYYY').format('x'),
      },
      previous: {
        ...previous,
        date: moment(previous.date, 'MM.DD.YYYY').format('x'),
      },
      status: 'Submitted'
    }

    const method = '_id' in query ? 'PATCH' : 'POST';
    const href = '_id' in query ? `/pcr/submit/endpoint?_id=${query._id}` : '/pcr/submit/endpoint';

    // upload data to db
    const data = await serverFetch({
      method,
      href,
      body
    })

    modal.spinner.hide();
    modal.success.show(`Pay change request ${'_id' in query ? 'updated' : 'submitted'}.`)
    if ( '_id' in query && window ) window.history.back()
    reset();
  }
  
  // props ( internal )
  let change = {
    after: '$0.00',
    code: '',
    date: moment().endOf('week').add(15, 'days').format('MM.DD.YYYY'),
    description: '',
    exempt: undefined,
    explanation: '',
    previous: '$0.00',
    percent: '0.0%',
  }
  let loaded = false;
  const mask = {
    currency : {
      mask:'\$X', 
      blocks:{
        X:{
          mask:Number, 
          scale:2, 
          radix:'.', 
          thousandsSeparator:',', 
          padFractionalZeros:true
        }
      }
    },
    percent: {
      mask:'X\%', 
      blocks:{
        X:{
          mask:Number, 
          scale:1, 
          radix:'.', 
          thousandsSeparator:',', 
          padFractionalZeros:true
        }
      }
    }
  }
  let previous = {
    after: '',
    code: '',
    date: '',
    description: '',
    exempt: undefined,
    explanation: '',
    previous: '',
    percent: '',
  }
  let user;
  let users = [];
  let userId = '';
  
  // props ( external )
  export let query;
  
  // props ( dynamic )
  $: changeCodeOptions = Object.keys(changeCodes).map(code=>{return{label:code, value:code}}).sort((a,b)=>a.label<b.label?-1:a.label>b.label?1:0)
  $: changeCodeDescriptionOptions = Object.keys(changeCodes).map(code=>{return{label:changeCodes[code], value:changeCodes[code]}}).sort((a,b)=>a.label<b.label?-1:a.label>b.label?1:0)
  $: userOptions = [{label:'-- Select an Employee', value:''}, ...[...users].map(user=>{return{label:`${user.firstName} ${user.lastName}`, value: user._id}})]

  // stores
  import { modal } from '$stores';
  
  onMount(async() => {
    // await updateHistory();
    users = await getDirectReportUsers({self:false});
    if ( '_id' in query ) await getPCR();
    loaded = true;
  })
</script>

<Section>
  {#if loaded}
    <Card>
      <div class="flex flex-col space-y-[2rem] items-start">
        <Select readonly={'_id' in query ? true : false} on:change={employeeChangeHandler} label="Employee" bind:value={userId} bind:options={userOptions} />
        {#if user !== undefined}
        <div class="flex flex-col space-y-[2rem] w-full lg:flex-row lg:space-x-[2rem] lg:space-y-[0]">
          <div class="flex flex-col space-y-[1rem] items-start flex-grow">
            <div class="font-bold">Last Change</div>
            <Input label="Effective Date" type="date" readonly bind:value={previous.date} />
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem] lg:w-full">
              <Input width="w-[150px]" label="Previous{previous.exempt ? ' (Annual)' : previous.exempt === false ? ' (Hourly)' : ''}" mask={mask.currency} readonly bind:value={previous.previous} class="text-right" />
              <Input width="w-[150px]" label="After{previous.exempt ? ' (Annual)' : previous.exempt === false ? ' (Hourly)' : ''}" mask={mask.currency} readonly bind:value={previous.after} class="text-right" />
              <Input width="w-[90px]" label="Percent" mask={mask.percent} readonly bind:value={previous.percent} class="text-right" />
            </div>
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem] lg:w-full">
              <Input width="w-[75px]" label="Code" readonly bind:value={previous.code} />
              <Input width="w-[290px]" label="Description" readonly bind:value={previous.description} />
            </div>
            <Textarea labelClasses="w-full" class="resize-none h-[70px]" label="Explanation" readonly bind:value={previous.explanation} />
          </div>
          <div class="flex flex-col space-y-[1rem] items-start flex-grow">
            <div class="font-bold">New Change</div>
            <Input label="Effective Date" type="date" bind:value={change.date} />
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem] lg:w-full">
              <Input readonly width="w-[150px]" label="Previous{change.exempt ? ' (Annual)' : change.exempt === false ? ' (Hourly)' : ''}" mask={mask.currency} bind:value={change.previous} class="text-right" />
              <Input on:change={payChangeHandler} width="w-[150px]" label="After{change.exempt ? ' (Annual)' : change.exempt === false ? ' (Hourly)' : ''}" mask={mask.currency} bind:value={change.after} class="text-right" />
              <Input on:change={percentChangeHandler} width="w-[90px]" label="Percent" mask={mask.percent} bind:value={change.percent} class="text-right" />
            </div>
            <div class="flex flex-col space-y-[1rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem] lg:w-full">
              <Select on:change={codeChangeHandler} label="Code" bind:value={change.code} bind:options={changeCodeOptions} />
              <Select on:change={codeDescriptionChangeHandler} label="Description" bind:value={change.description} bind:options={changeCodeDescriptionOptions} />
            </div>
            <Textarea labelClasses="w-full" class="resize-none h-[70px]" label="Explanation" bind:value={change.explanation} />
          </div>
        </div>
        <div class="flex justify-end w-full">
          <Button on:click={submitHandler}>{'_id' in query ? 'Update' : 'Submit'}</Button>
        </div>
        {/if}
      </div>
    </Card>
  {:else}
    <div class="h-full min-h-full flex items-center justify-center">
      <Card>
        <Spinner />
      </Card>
    </div>
  {/if}
</Section>