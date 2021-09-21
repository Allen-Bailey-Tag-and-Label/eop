export const currencyFormat = n => {
  const nf = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  });
  return nf.format(n);
}
export const emailIsValid = email => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email.toLowerCase())
export const numberFormat = (n, options = {}) => {
  const nf = new Intl.NumberFormat('en-US', options);
  return nf.format(n, options);
}
export const objectToUrlQueryParams = obj => Object.keys(obj).map(key=>`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`).join('&');
export const serverFetch = async (params) => {
  let body, headers, href, method;

  // check if string supplied
  if ( typeof params === 'string' ) {
    href = params;
    method = 'GET';
  } else {
    body = params.body;
    href = params.href;
    method = params.method;
    headers = {
      'Accept': 'application/json',
      'Content-Type':'application/json'
    }
    if ( 'headers' in params ) headers = params.headers;
  }

  let options = {method}

  if ( method.toUpperCase() !== 'GET') {
    options.body = JSON.stringify(body);
    options.headers = headers
  }

  const response = await fetch(href, options);
  const data = await response.json();
  return data;
}