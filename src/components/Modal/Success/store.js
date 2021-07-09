import { writable } from 'svelte/store';

const { set, subscribe, update } = writable( {show: false, message: ''} );

export default {
  hide: () => update(({message})=>{return{show:false, message}}),
  set,
  show: (message) => update(()=>{return{show:true, message}}),
  subscribe
}