import { writable } from 'svelte/store';

const { set, subscribe } = writable( false );

export default {
  hide: () => set(false),
  set,
  show: () => set(true),
  subscribe
}