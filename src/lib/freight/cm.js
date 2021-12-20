// imports
import { serverFetch } from '../_helpers';
import { calculate, ltl } from './upcharges';

export const getSeskey = async () => {
  try {
    // get html
    const html = await serverFetch({
      method: 'POST',
      href: `https://bobthered-cors-anywhere.herokuapp.com/http://tracking.carrierlogistics.com/scripts/cm.pol/web-login.htm?wlogin=Allenbailey&wpword=JDEshipping3`,
      responseType: 'TEXT'
    });

    // create temporary html element
    const el = document.createElement('html');

    // set innerHTML
    el.innerHTML = html;

    // query for seskey
    const seskey = el.querySelector('input[name="seskey"]').value;

    // remove temporary html element
    el.remove();

    return seskey
  } catch (error) {
    throw error
  }
}

export default async (params) => {
  // initiate default options
  const defaults = {
    includesSkidWeight: false,
    packages: undefined,
    packageClass: '055',
    packageWeight: undefined,
    pallets: 1,
    totalWeight: undefined,
    zip: undefined
  }

  // merge defaults with params
  const options = Object.assign(defaults, params);

  // deconstruct options
  let { includesSkidWeight, packages, packageClass, packageWeight, pallets, totalWeight, zip } = options;
  
  // check if packageWeight supplied
  if (packages && packageWeight) totalWeight = +packages * +totalWeight;

  // check if total weight does not include skids
  if (!includesSkidWeight && pallets && totalWeight) totalWeight = +totalWeight + +pallets * 50

  // error handling
  if (packages === undefined || +packages === 0) throw 'Package count missing.'
  if (totalWeight === undefined || +totalWeight === 0) throw 'Total weight missing.'
  if (zip === undefined || zip === '') throw 'Zipcode missing.'

  try {
    // get seskey
    const seskey = await getSeskey();

    // create formdata
    const formdata = new FormData();
    formdata.append("seskey", seskey);
    formdata.append("vozip", "14423");
    formdata.append("vdzip", zip);
    formdata.append("wpieces[1]", packages);
    formdata.append("wpallets[1]", pallets);
    formdata.append("wweight[1]", totalWeight);
    formdata.append("vclass[1]", packageClass);

    // create request options
    const requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };

    // get response
    const response = await fetch("https://bobthered-cors-anywhere.herokuapp.com/https://tracking.carrierlogistics.com/scripts/cm.pol/saveratereq.htm", requestOptions);

    // get html
    const html = await response.text();

    // create temporary html element
    const el = document.createElement('html');

    // set innerHTML
    el.innerHTML = html;

    // query for rate
    const rate = +el.querySelector('table.quote tfoot tr.tableheader th:last-child').innerHTML.replace(/(\$|\,)/g, '');

    // query for quote number
    const quote = el.querySelector('.pickup_text').innerHTML.replace(/\s/g, '');

    // remove temporary html element
    el.remove();

    // calculate upcharge
    const upcharge = calculate(rate, ltl);

    // calculate totalfreight
    const total = rate + upcharge;

    return { quote, rate, total, upcharge }
  } catch (error) {
    throw error
  }
}