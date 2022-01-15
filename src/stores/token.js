// imports
import { get } from 'svelte/store';
import localStorageStore from './localStorageStore.js';
import socketStore from './socket.js';

// initiate methods
const methods = {
  reset: ({ set }) => {
    return () => set('')
  },
  set: ({ update }) => {
    return token => {
      localStorage.setItem('token', JSON.stringify(token));
      update(()=>token);
    }
  },
  subscribe: ({ subscribe }) => subscribe,
  verify: ({ set }) => {
    return async () => {
      // get socket from store
      const socket = get(socketStore);

      // initiate verified variable
      let verified = false;

      // create promise
      await new Promise(res => {
        // get token
        const token = JSON.parse(localStorage.getItem('token'))

        // emit to server
        socket.emit('verifyToken', { token }, ({ error, token }) => {
          // if error exists, reset token
          if (error) localStorage.setItem('token', JSON.stringify(''))

          // if token exits, update token and verify user
          if (token) {
            set(token);
            verified = true;
          }
          res();
        })
      });

      return verified;
    }
  }
}

export default localStorageStore('token', '', methods)