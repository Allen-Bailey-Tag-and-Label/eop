export const serverFetch = async (params) => {
  let body, href, method;

  // check if string supplied
  if ( typeof params === 'string' ) {
    href = params;
    method = 'GET';
  } else {
    body = params.body;
    href = params.href;
    method = params.method;
  }

  let options = {method}

  if ( method.toUpperCase() !== 'GET') {
    options.body = JSON.stringify(body);
    options.headers = {
      'Accept': 'application/json',
      'Content-Type':'application/json'
    }
  }

  const response = await fetch(href, options);
  const data = await response.json();
  return data;
}