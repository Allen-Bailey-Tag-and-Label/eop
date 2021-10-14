import { writable } from 'svelte/store';
import { serverFetch } from '$lib/_helpers'

const localStorageStore = (key, initialValue = null) => {
  let value;

  if (typeof localStorage !== 'undefined') {
    value = JSON.parse(
      localStorage.getItem(key) || JSON.stringify(initialValue),
    );
  } else {
    value = [];
  }

  const {set, subscribe, update} = writable(value);

  if (typeof localStorage !== 'undefined') {
    subscribe(v => {
      localStorage.setItem(key, JSON.stringify(v));
    });
  }

  // methods
  const is = {
    signedin: () => {
      let signedin;
      subscribe(state=>signedin = JSON.stringify(state)==='{}' ? false : true)
      return signedin;
    }
  }
  const on = {
    signin : () => {
      let route;
      subscribe(state=>route=state?.on?.signin);
      return route;
    }
  }
  const signin = async body => {
    const data = await serverFetch({method:'POST', href:'/api/auth/signin', body})
    if ( data.accessToken ) update(()=>data.accessToken);
    if ( data.error ) update(()=>{return null});
    return data;
  }
  const signout = () => {
    update(()=>{return null});
  }

  return {
    is,
    on,
    signin,
    signout,
    subscribe
  };
};

const accessToken = localStorageStore('accessToken', null)

export default accessToken;

export const changePassword = async (accessToken, currentPassword, password) => {
  const data = await serverFetch({method:'POST', href:'/api/auth/changepassword', body: {accessToken, currentPassword, password}})
  if ( 'error' in data ) throw data.error
  return data;
}

export const getSignInRoute = async accessToken => {
  const data = await serverFetch({method:'POST', href:'/api/auth/get/signinroute', body:{accessToken}});
  return data.route
}

export const getRoutes = async accessToken => {
  const data = await serverFetch({method:'POST', href:'/api/auth/get/userroutes', body:{accessToken}});
  return data.routes;
}
