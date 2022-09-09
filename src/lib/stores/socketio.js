import { writable } from 'svelte/store';

const createStore = () => {
  const { set, update } = writable([]);

  const register = ({ event, listener }) => update((state) => [...state, { event, listener }]);
  const signout = () => set([]);

  return { register, signout };
};

export default createStore();
