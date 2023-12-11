import { writable } from 'svelte/store';

const createStore = () => {
  // initialize store
  const { subscribe, update } = writable({ groups: {}, isOpen: false });

  // methods
  const close = () => {
    update((state) => {
      return {
        ...state,
        isOpen: false
      };
    });
  };
  const open = () => {
    update((state) => {
      return {
        ...state,
        isOpen: true
      };
    });
  };
  const setGroups = (groups) => {
    update((state) => {
      return {
        ...state,
        groups
      };
    });
  };
  const toggle = () => {
    update((state) => {
      return {
        ...state,
        isOpen: !state.isOpen
      };
    });
  };

  return {
    close,
    open,
    setGroups,
    subscribe,
    toggle
  };
};

export const nav = createStore();
