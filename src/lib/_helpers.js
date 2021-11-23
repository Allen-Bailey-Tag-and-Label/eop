export const currencyFormat = n => {
  const nf = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  });
  return nf.format(n);
}
export const emailIsValid = email => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email.toLowerCase())
export const get = (obj, path, def) => {
  var fullPath = path
    .replace(/\[/g, '.')
    .replace(/]/g, '')
    .split('.')
    .filter(Boolean);

  return fullPath.every(everyFunc) ? obj : def;

  function everyFunc(step) {
    return !(step && (obj = obj[step]) === undefined);
  }
}
export const numberFormat = (n, options = {}) => {
  const nf = new Intl.NumberFormat('en-US', options);
  return nf.format(n, options);
}
export const objectToUrlQueryParams = obj => Object.keys(obj).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`).join('&');
export const set = (obj, path, value) => {
  if (Object(obj) !== obj) return obj; // When obj is not an object
  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
  path.slice(0, -1).reduce((a, c, i) => // Iterate all of them except the last one
    Object(a[c]) === a[c] // Does the key exist and is its value an object?
      // Yes: then follow that path
      ? a[c]
      // No: create the key. Is the next key a potential array-index?
      : a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1]
        ? [] // Yes: assign a new array object
        : {}, // No: assign a new plain object
    obj)[path[path.length - 1]] = value; // Finally assign the value to the last key
  return obj; // Return the top-level object to allow chaining
};
export const serverFetch = async (params) => {
  let body, headers, href, method;

  // check if string supplied
  if (typeof params === 'string') {
    href = params;
    method = 'GET';
  } else {
    body = params.body;
    href = params.href;
    method = params.method;
    headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
    if ('headers' in params) headers = params.headers;
  }

  let options = { method }

  if (method.toUpperCase() !== 'GET') {
    options.body = JSON.stringify(body);
    options.headers = headers
  }

  const response = await fetch(href, options);
  const data = await headers?.['Content-Type'] === 'application/json' || headers === undefined ? response.json() : response.text();
  return data;
}