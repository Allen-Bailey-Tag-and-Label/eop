import { writable } from 'svelte/store';

const { set, subscribe, update } = writable( {show: false, message: '', confirm: () => {}} );

export default {
  hide: () => update(({message, confirm})=>{return{show:false, message, confirm}}),
  set,
  show: (message, confirm) => update(()=>{return{show:true, message, confirm}}),
  subscribe
}