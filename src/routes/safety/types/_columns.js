import frequencyOptions from './_frequencyOptions';
import monthOptions from './_monthOptions';

export default [
  {title:'Name', key:'name'},
  {title:'Frequency', key:'frequency', type: 'select', options: frequencyOptions},
  {title:'Month', key:'month', type: 'select', options: monthOptions},
]