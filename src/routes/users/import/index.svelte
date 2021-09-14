<script>
  // _imports
  import moment from 'moment';
  import { serverFetch } from '$lib/_helpers';

  // components
  import { Button, Section } from '$components';

  // handler
  const submitHandler = async () => {
    const employees = csv.split("\n").map(row=>row.split("\t"))
    const columns = employees.shift();
    modal.spinner.show();
    await Promise.all(employees.map(async employee=>{
      employee = employee.reduce((obj, value, i) => {
        if ( columns[i] === 'roles' ) value = value.split('|');
        if ( columns[i] === 'hireDate' ) value = moment(value, 'MM.DD.YYYY').format('x')
        obj[columns[i]] = value;
        return obj;
      }, {})
      await serverFetch({
        method: 'POST',
        href: '/api/auth/signup',
        body: employee
      })
    }))
    modal.spinner.hide();
    csv = '';
  }

  // props ( internal )
  let csv = `firstName	lastName	username	extension	roles	ennisId	email	hireDate
Nicole	Acton	nacton	1008	Customer Service	197501	nacton@abtl.com	01.05.2015
Daniel	Baylor	dbaylor		Machine Operator	156035		10.06.1980
Jodi	Bessel	jbessel	1004	Customer Service	197618	jbessel@abtl.com	01.15.2020
Kimberly	Canute	kcanute	1019	Customer Service	197506	kcanute@abtl.com	11.24.2014
Philip	Carlson	pcarlson	1030	Shipping	197536		05.21.2012
Charles	Carson	ccarson		Machine Operator	197537		03.07.2011
Ryan	Coleman	rcoleman	1033	Machine Operator	197540		11.22.1999
Jeremy	Cornell	jcornell		Machine Operator	197541		06.21.2010
Sean	Costello	scostello		Customer Service	197508	scostello@abtl.com	07.31.2017
David	Davis	ddavis		Machine Operator	197543		10.16.2010
John	Dykstra	jdykstra		Machine Operator	197544		11.30.1987
Travis	Englert	tenglert		Maintenance	197630		07.06.2021
James	Fennell	jfennell	1023	Maintenance Supervisor|Safety Manager	197510	jfennell@abtl.com	11.22.1999
Dale	Ferreira	dferreira		Machine Operator	197546		09.28.2015
Scott	Filio	sfilio	1027	Production Manager	197511	sfilio@abtl.com	03.09.1992
Kathleen	Fitchette	kfitchette		Machine Operator	197547		05.05.1969
Michael	Foose	mfoose		Machine Operator	156050		08.01.2011
John	Formella	jformella	1017	Customer Service	156117	john_formella@ennis.com	05.06.2019
John	Grieco	jgrieco		Machine Operator	197614		08.06.2018
Edward	Guldenschuh	eguldenschuh	1006	Machine Operator	197550	eguldenschuh@abtl.com	02.11.2006
Patricia	Hart	phart		Machine Operator	197551		03.04.2002
Dawn	Hirsch	dhirsch		Customer Service	197552		05.19.2017
Penny	Hogan	phogan		Machine Operator	197553		12.17.2012
Laurie	Hungerford	lhungerford		Machine Operator	197611		03.16.1994
Stephen	Jones	sjones		Machine Operator	197560		04.19.2010
John	Kilcoyne	jkilcoyne	1002	Customer Service|Customer Service Manager|IT	197518	jkilcoyne@abtl.com	03.10.2014
Daniel	Koenig	dkoenig		Machine Operator	197562		09.26.1991
Anthony	Kozak	akozak	1018	Customer Service	197520	ajkozak@abtl.com	10.23.2017
Steven	Krisanda	skrisanda	1031	Label Manager	197521	skrisanda@abtl.com	11.16.2015
Amanda	Lane	alane		Machine Operator	197565		06.13.2016
Dawn	Lawrence	dlawrence		Machine Operator	197567		12.19.2005
Russell	Lawrence	rlawrence	1024	Shipping	197625		11.30.2020
William	Lawrence	wlawrence		Machine Operator	197568		08.18.2014
Robert	Leubner	rleubner		Machine Operator	197570		08.18.2008
Dorothy	Lingle	dlingle		Machine Operator	197571		06.19.2006
Joshua	Litteer	jlitteer	1029	Prepress|IT	156079		06.07.2021
Thomas	Livermore	tlivermore		Machine Operator	156059		08.02.2021
Wanda	Manning	wmanning	1028	Prepress	197573		09.29.1986
Nicole	Martino	nmartino		Machine Operator	197575		12.13.2010
Colin	McAleavey	cmcaleavey	1013	Prepress	156118	cmcaleavey@abtl.com	10.21.2019
Logan	McLean	lmclean		Machine Operator	197626		05.10.2021
Mark	Napier	mnapier		Machine Operator	197579		02.23.1994
Kenneth	Norton	knorton	1026	Shipping	197524	knorton@abtl.com	03.27.1990
Christine	O'Brien	cobrien		Customer Service	197525	cobrien@abtl.com	05.03.1993
Robert	Paduano	rpaduano		Shipping	197632		09.07.2021
Jacqueline	Panipinto	jpanipinto		Machine Operator	197584		07.28.2011
Tammy	Perrine	tperrine		Machine Operator	197628		06.14.2021
Jeffrey	Pike	jpike		Machine Operator	197588		09.28.2015
Gale	Ramsey	gramsey		Machine Operator	197590		03.27.1968
Jacob	Rohn	jrohn		Machine Operator	197593		09.08.2015
Eric	Selfridge	eselfridge		Machine Operator	156071		10.14.2004
Kent	Smythe	ksmythe		Machine Operator	156037		10.05.2011
David	Taft	dtaft		Machine Operator	197601		03.06.2000
Tammy	Vanelli	tvanelli		Machine Operator	197602		09.23.2002
Diane	Vonglis	dvonglis	1014	Purchasing	197529	dvonglis@abtl.com	12.03.2012
Kathleen	Williams	kwilliams	1010	A/P|A/R|Credit Management	197604	kwilliams@abtl.com	07.06.1998
`;

  // store
  import { modal } from '$stores'
</script>

<Section>
  <form on:submit|preventDefault={submitHandler} class="flex flex-col space-y-[2rem]">
    <textarea bind:value={csv} />
    <Button type="submit">Submit</Button>
  </form>
</Section>