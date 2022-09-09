import { writable } from 'svelte/store';
import { clientConnection as socketio } from '$lib/socketio';

const createStore = () => {
  const { set, update } = writable([]);

  const register = ({ event, listener }) => update((state) => [...state, { event, listener }]);
  const signout = () => {
    update((state) => {
      state.map(({ event, listener }) => {
        socketio.off(event, listener);
      });
      return [];
    });
  };

  return { register, signout };
};

export default createStore();
