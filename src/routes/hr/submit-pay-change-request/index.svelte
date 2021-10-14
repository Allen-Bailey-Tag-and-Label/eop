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
        if ( previous.exempt === false && change.exempt === true ) change.previous = currencyFormat(pcr.change.after * 2080);
        if ( previous.exempt === change.exempt ) change.previous = currencyFormat(pcr.change.after);
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
    const percent = Math.round(((after / previous)-1)*1000) / 10;
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
    const href = '_id' in query ? `/hr/submit-pay-change-request/endpoint?_id=${query._id}` : '/hr/submit-pay-change-request/endpoint';

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
  const updateHistory = async () => {
    const table = `6140947e36b17e6114a66aea	Amanda Lane	197565	FALSE	2046109	326350	Machine Operator	007	4299	11/23/2020	$14.00	$13.00	-7.1%	002	Rehire	Rehire for finishing - previously press operator in Acme
613a204ebf5ba54220018067	Amy McAleavey	156072	FALSE	2046901	31571	HR Rep.	005	8810	7/3/2021	$16.00	$17.00	6.3%	304	New Responsibilities	Amy has been vital to ABLT transitioning to JDE & has continued to take on additional tasks/responsibilities such as credit management & accounts receivable functions
6140947d36b17e6114a66ae8	Anthony Kozak	197520	FALSE	2046731	32431	Customer Service Rep.	004	8810	12/29/2019	$22.15	$22.59	2.0%	310	Annual Review	CSR/Estimator - Taking on new role as a float between roles - primary role will now be lead CSR for GBS
6140947a36b17e6114a66ad2	Charles Carson	197537	FALSE	2046108	326350	Machine Operator	007	4299	3/25/2019	$17.48	$18.00	3.0%	301	Broadened Responsibility	Improvements to quality. Highly dependable production rates. More in line with rest of dept. Valued employee. Has continued steady progress
6140947f36b17e6114a66af8	Christine O'Brien	197525	FALSE	2046731	12431	Customer Service Rep. (S)	004	8810	5/1/2018		$50.67		001	New Hire	Acquisition/New hire
6140947f36b17e6114a66af4	Colin McAleavey	156118	FALSE	2046610	32615	Composition Work	006	4299	7/3/2021	$14.00	$14.50	3.6%	308	Review	Colin was rehired from 4601 BU and given a 3 month probationary period at which time would receive a $.50 raise if her performed his duties well - which he has done
6140947b36b17e6114a66ada	Dale Ferreira	197546	FALSE	2046108	326350	Machine Operator	007	4299	5/17/2021	$21.37	$22.12	3.5%	310	Annual Review	Merit/Retention. Lead 2nd shift. Is exceptional at what he does. Suv concerned about opportunities closer to his home, etc.
6140947a36b17e6114a66ace	Daniel Baylor	156035	FALSE	2046109	326350	Machine Operator	007	4299	7/3/2021	$13.50	$16.00	18.5%	304	New Responsibilities	Dan has been moved to a tag press position to utilize his printing experience
6140947d36b17e6114a66ae7	Daniel Koenig	197562	FALSE	2046108	326350	Machine Operator	007	4299	12/22/2019	$22.02	$22.46	2.0%	310	Annual Review	Annual - Lead first shift
6140947b36b17e6114a66ad6	David Davis	197543	FALSE	2046613	32901	Janitor	009	4299	9/5/2021	$14.34	$14.84	3.5%	310	Annual Review	Additional job duties of cutting grass at ABTL & SPF
6140948136b17e6114a66b01	David Taft	197601	FALSE	2046301	326350	Machine Operator	007	4299	9/12/2021	$14.55	$14.98	3.0%	310	Annual Review	Top performer on wire machines. Aids in training new hires as well
6140947c36b17e6114a66ae2	Dawn Hirsch	197552	FALSE	2046731	42500	Office Clerk PT	004	8810	12/27/2020	$11.80	$12.50	5.9%	008	Payroll Adjustment	NYS Minimum Wage  increase
6140947e36b17e6114a66aeb	Dawn Lawrence	197567	FALSE	2046109	326350	Machine Operator	007	4299	6/20/2021	$16.12	$16.60	3.0%	301	Broadened Responsibility	Dawn will help run more complicated 3 over 2 press as needed - She does anything to help the company get the work out
6140948136b17e6114a66b03	Diane Vonglis	197529	TRUE	2046901	32523	Pruchasing Clerk	005	8810	3/31/2019	$62,920.00	$64,178.40	2.0%	310	Annual Review	Annual review
6140947e36b17e6114a66aef	Dorothy Lingle	197571	FALSE	2046109	326350	Machine Operator	007	4299	6/30/2019	$16.97	$17.31	2.0%	310	Annual Review	Annual review
6140947c36b17e6114a66ae0	Edward Guldenschuh	197550	FALSE	2046109	326350	Machine Operator	007	4299	7/3/2021	$22.00	$22.66	3.0%	310	Annual Review	Annual Review - Ed continues to perform well in his role as tag press supervisor
6140948036b17e6114a66aff	Eric Selfridge	156071	FALSE	2046301	326350	Machine Operator	007	4299	5/17/2021	$13.50	$13.77	2.0%	310	Annual Review	Merit - Eric has caught on very well & is performing up to or above expected rates
6140948036b17e6114a66afd	Gale Ramsey	197590	FALSE	2046301	326350	Machine Operator	007	4299	5/12/2019	$17.51	$17.86	2.0%	310	Annual Review	Annual review
6140948036b17e6114a66afe	Jacob Rohn	197593	FALSE	2046108	32605	Press Operator	006	4299	12/22/2019	$13.77	$14.05	2.0%	310	Annual Review	Annual review
6140948036b17e6114a66afa	Jacqueline Panipinto	197584	FALSE	2046109	326350	Machine Operator	007	4299	7/28/2019	$16.65	$17.00	2.1%	310	Annual Review	Jackie is a valued employee & needs little direction. She is learning new presses & has a keen eye for defects
6140947b36b17e6114a66ad9	James Fennell	197510	TRUE	2046613	126550	Maintenance Supervisor (S)	010	4299	9/12/2021	$68,660.80	$70,034.02	2.0%	310	Annual Review	Vital asset to management. Also oversees safety program
6140948036b17e6114a66afc	Jeffrey Pike	197588	FALSE	2046301	326350	Machine Operator	007	4299	9/12/2021	$14.02	$14.44	3.0%	310	Annual Review	Continues to perform well, aids in training new hires & other co-workers
6140947b36b17e6114a66ad4	Jeremy Cornell	197541	FALSE	2046109	326350	Machine Operator	007	4299	5/17/2021	$15.58	$16.20	4.0%	301	Broadened Responsibility	Position upgrade to lead BT operator. Jeremy will troubleshoot for other operators, train new operators, distribute WO's, and verify correct information on WO's. Some mechanical repair when possible.
6140947a36b17e6114a66acf	Jodi Bessel	197618	FALSE	2046731	32431	Customer Service Rep.	004	8810	1/15/2020		$21.63		002	Rehire	Rehire
6140947b36b17e6114a66ad7	John Dykstra	197544	FALSE	2046109	326350	Machine Operator	007	4299	12/3/2018	$17.77	$18.25	2.7%	301	Broadened Responsibility	Long term employee with great attibutes as review shows. Needs no direction in daily tasks
6140947c36b17e6114a66ade	John Formella	156117	FALSE	2046731	32431	Customer Service Rep.	004	8810	5/16/2019		$17.00		001	New Hire	New hire
6140947c36b17e6114a66adf	John Grieco	197614	FALSE	2046108	326350	Machine Operator	007	4299	8/16/2021	$18.87	$19.25	2.0%	310	Annual Review	
6140947d36b17e6114a66ae6	John Kilcoyne	197518	TRUE	2046795	124660	Sales Manager (S)	004	8742	5/5/2019	$74,984.00	$76,483.68	2.0%	310	Annual Review	Annual Review
6140947e36b17e6114a66af0	Joshua Litteer	156079	FALSE	2046610	32615	Composition Work	006	4299	9/5/2021	$14.00	$14.50	3.6%	308	Review	$0.50 increase agreed upon positive 3 month review
6140947b36b17e6114a66adc	Kathleen Fitchette	197547	FALSE	2046301	326350	Machine Operator	007	4299	9/12/2021	$17.68	$18.03	2.0%	310	Annual Review	Annual Review
6140942c36b17e6114a66acc	Kathleen Williams	197604	FALSE	2046901	325060	Invoicing Clerk	005	8810	3/31/2019	$18.54	$18.91	2.0%	310	Annual Review	Annual review
6140947f36b17e6114a66af7	Kenneth Norton	197524	TRUE	2046109	12145	Press Operator	006	4299	11/29/2020	$56,880.10	$58,302.10	2.5%	304	New Responsibilities	Added shipping manager & production backup responsibilities
6140948036b17e6114a66b00	Kent Smythe	156037	FALSE	2046109	326350	Machine Operator	007	4299	12/22/2019	$14.50	$15.01	3.5%	310	Annual Review	Annual - Ken has made improvements over past year in set up time. He also volunteers to be a part of our safety committee
6140947a36b17e6114a66ad0	Kimberly Canute	197506	FALSE	2046731	32431	Customer Service Rep.	004	8810	3/1/2020	$32.11	$32.72	1.9%	310	Annual Review	Lead estimator, CSR, special projects, Sr Navision resource (Key) - Kim overseas 1 employee, leads all pricing projects & is liaison to other Ennis plants
6140947d36b17e6114a66ae4	Laurie Hungerford	197611	FALSE	2046301	326350	Machine Operator	007	4299	9/12/2021	$18.34	$18.89	3.0%	310	Annual Review	Laurie is the #1 performer in the dept & willing to help in any way
6140947f36b17e6114a66af5	Logan McLean	197626	FALSE	2046601	32425	Material Handler	008	4299	5/10/2021		$13.50		001	New Hire	New hire
6140947f36b17e6114a66af6	Mark Napier	197579	FALSE	2046109	326350	Machine Operator	007	4299	2/23/2020	$22.29	$22.66	1.7%	310	Annual Review	Annual review - versatile employee, willing to work OT when needed
6140947c36b17e6114a66add	Michael Foose	156050	FALSE	2046601	32425	Material Handler	008	4299	8/16/2021	$13.50	$14.00	3.7%	301	Broadened Responsibility	Ship help/Warehouse help/ all around help - Miked has done a great job getting organized. He helps wherever is needed and goes beyond material handling
6140947936b17e6114a66acd	Nicole Acton	197501	FALSE	2046731	32431	Customer Service Rep.	004	8810	6/7/2021	$28.54	$29.25	2.5%	310	Annual Review	Top CSR - handles ABTL prime accounts; assists in training
6140947f36b17e6114a66af3	Nicole Martino	197575	FALSE	2046301	326350	Machine Operator	007	4299	12/27/2020	$12.44	$12.50	0.5%	008	Payroll Adjustment	NYS Minimum Wage  increase
6140947c36b17e6114a66ae1	Patricia Hart	197551	FALSE	2046301	326350	Machine Operator	007	4299	9/12/2021	$14.91	$15.35	3.0%	301	Broadened Responsibility	Patty has taken on learning more machines and continues to improve
6140947d36b17e6114a66ae3	Penny Hogan	197553	FALSE	2046301	326350	Machine Operator	007	4299	5/18/2020	$13.77	$13.27	-3.6%	005	Shift Change	Remove shift differential from base wage
6140947a36b17e6114a66ad1	Philip Carlson	197536	FALSE	2046631	32727	Shipping Clerk	008	4299	5/10/2021	$15.41	$16.18	5.0%	301	Broadened Responsibility	Phil will be expanding his role to lead shipper in Bldg 2
6140947e36b17e6114a66aee	Robert Leubner	197570	FALSE	2046109	326350	Machine Operator	007	4299	5/23/2021	$20.57	$21.18	3.0%	310	Annual Review	Rob takes the initiative to make sure things get done & is always willing to help coworkers. Robis able to run all of the presses & any of the complex jobs that are handed to him
6140948036b17e6114a66af9	Robert Paduano	197632	FALSE	2046631	32727	Shipping Clerk	008	4299	9/7/2021		$14.00		001	New Hire	New hire
6140947e36b17e6114a66aec	Russell Lawrence	197625	FALSE	2046631	32727	Shipping Clerk	008	4299	5/3/2021	$14.00	$14.70	5.0%	301	Broadened Responsibility	Has shown great progress in 5 months and is expanding his role - Russ will be lead shipper in Bldf. 1
6140947a36b17e6114a66ad3	Ryan Coleman	197540	FALSE	2046631	32731	Slitter Operator	007	4299	7/3/2021	$17.14	$17.57	2.5%	310	Annual Review	Annual Review
6140947b36b17e6114a66adb	Scott Filio	197511	TRUE	2046301	12145	Production Manager (M) SALARY	010	4299	11/29/2020	$65,684.14	$67,326.86	2.5%	304	New Responsibilities	Promoted to Production Manager - 6 month increase
6140947b36b17e6114a66ad5	Sean Costello	197508	FALSE	2046731	32431	Customer Service Rep.	004	8810	5/1/2018		$24.04		001	New Hire	New Hire - at acquisition
6140947d36b17e6114a66ae5	Stephen Jones	197560	FALSE	2046013	32605	Press Operator	006	4299	4/28/2019	$14.61	$14.90	2.0%	310	Annual Review	Annual review
6140947e36b17e6114a66ae9	Steven Krisanda	197521	TRUE	2046108	12145	Press Operator	006	4299	3/31/2019	$69,284.80	$70,670.50	2.0%	310	Annual Review	Annual review
6140948036b17e6114a66afb	Tammy Perrine	197628	FALSE	2046301	326350	Machine Operator	007	4299	6/14/2021		$13.00		001	New Hire	New hire
6140948136b17e6114a66b02	Tammy Vanelli	197602	FALSE	2046301	326350	Machine Operator	007	4299	5/17/2021	$14.79	$15.23	3.0%	310	Annual Review	Merit - Overdue. Continues to lead & perform above normal rates
6140947f36b17e6114a66af1	Thomas Livermore	156059	FALSE	2046109	326350	Machine Operator	007	4299	8/2/2021		$17.00		002	Rehire	Rehire
6140947b36b17e6114a66ad8	Travis Englert	197630	FALSE	2046613	32639	Maintenance	009	4299	7/6/2021		$19.00		001	New Hire	New Hire
6140947f36b17e6114a66af2	Wanda Manning	197573	FALSE	2046610	32615	Composition Work	006	4299	9/29/2019	$19.04	$19.61	3.0%	310	Annual Review	Promoted to PP Coordinator in Oct & has done a fantastic job managing OT & workflow while maintaining team morale. Wanda's leadership has strengthened a weak dept.
6140947e36b17e6114a66aed	William Lawrence	197568	FALSE	2046109	326350	Machine Operator	007	4299	8/25/2019	$21.00	$21.38	1.8%	310	Annual Review	Annual review`
    const pcrs = table.split("\n")

    await Promise.all(pcrs.map(async pcr => {
      const [ userId, employeeName, ennisId, exempt, costCenter, jobCode, jobTitle, eeoClassification, workCompClass, effectiveDate, previous, after, percent, code, description, explanation] = pcr.split("\t");
      const body = {
        userId,
        costCenter,
        jobCode,
        jobTitle,
        eeoClassification,
        workCompClass,
        change: {
          after,
          code,
          date: moment(effectiveDate, 'M/D/YYYY').format('x'),
          description,
          exempt : exempt === 'FALSE' ? false : true,
          explanation,
          previous,
          percent
        },
        status: 'Approved'
      };
      await serverFetch({
        method: 'POST',
        href: '/hr/submit-pay-change-request/endpoint',
        body
      })
    }))
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