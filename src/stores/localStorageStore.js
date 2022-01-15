// imports
import { writable } from 'svelte/store';

export default (key, initialValue = null, customMethods = null) => {
  // initiate store value
  let value;

  // check if localstorage exists
  if (typeof localStorage !== 'undefined') value = JSON.parse(localStorage.getItem(key) || JSON.stringify(initialValue))

  // initiate store
  const store = writable(value);

  // update localStorage
  if (typeof localStorage !== 'undefined') store.subscribe(v => {
    localStorage.setItem(key, JSON.stringify(v))
  })

  // initiate default methods
  const defaultMethods = {
    set: ({ set }) => {
      return (value = 0) => set(value);
    },
    subscribe: ({ subscribe }) => subscribe,
    update: ({ update }) => {
      return (value = 0) => update(v => v = value);
    }
  }

  // create methods
  const methods = Object.keys(customMethods !== null ? customMethods : defaultMethods).reduce((obj, key) => {
    obj[key] = customMethods !== null ? customMethods[key](store) : defaultMethods[key](store);
    return obj;
  }, {})

  return methods;
}
