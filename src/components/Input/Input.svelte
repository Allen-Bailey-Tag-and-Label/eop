<script>
  // _imports
  import { imask } from '@imask/svelte';

  // components
  import Date from './Date.svelte';
  import InputContainer from '../InputContainer.svelte';
  import Number from './Number.svelte';

  // props ( external )
  export let label           = '';
  export let labelClasses    = '';
  export let name            = '';
  export let placeholder     = '';
  export let readonly        = false;
  export let type            = '';
  export let value           = '';

  // props css ( external )
  export let appearance      = 'appearance-none';
  export let backgroundColor = 'bg-transparent';
  export let boxShadow       = '';
  export let flex            = 'flex-grow'
  export let fontWeight      = 'font-medium';
  export let outline         = 'outline-none focus:outline-none';
  export let padding         = 'px-[22px] py-[11px]'
  export let ring            = 'ring ring-white ring ring-opacity-0 focus:ring-opacity-10 ring-offset ring-offset-1 ring-offset-gray-400 hover:ring-offset-gray-200 focus:ring-offset-gray-200';
  export let rounded         = 'rounded';
  export let shadow          = '';
  export let textAlign       = '';
  export let textColor       = '';
  export let textSize        = '';
  export let transition      = 'transition duration-200';
  export let style           = '';
  export let whitespace      = 'whitespace-nowrap';
  export let width           = '';

  // props ( dynamic )
  $: if ( type === 'date' ) {
    padding = readonly ? 'px-[22px] py-[11px]' : 'pl-[22px] pr-[60px] py-[11px]';
    width = 'w-[165px]'
  }
  $: if ( !('ring' in $$props) && readonly) ring = 'shadow-underline'
  $: if ( !('rounded' in $$props) && readonly) rounded = ''
  $: classes = `${appearance} ${backgroundColor} ${boxShadow} ${flex} ${fontWeight} ${outline} ${padding} placeholder-transparent ${ring} ${rounded} ${shadow} ${textAlign} ${textColor} ${textSize} ${transition} ${whitespace} ${width} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

<InputContainer {label} class={label !== '' ? `pt-[32px] relative flex ${labelClasses}` : type === 'date' ? `relative ${labelClasses}` : `${labelClasses}`}>
  {#if type === 'currency'}
    <input disabled={readonly !== false ? 'disable' : false} {readonly} on:change type="text" use:imask={$$props.mask !== undefined ? $$props.mask : {mask:'\$X', blocks:{X:{mask:Number, scale:2, radix:'.', thousandsSeparator:',', padFractionalZeros:true}}}} {name} bind:value class="peer {classes}" {placeholder}  style={style !== undefined ? style : ''}/>
  {:else if type === 'date'}
    <Date disabled={readonly !== false ? 'disable' : false} {readonly} on:change {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {:else if type === 'email'}
    <input disabled={readonly !== false ? 'disable' : false} {readonly}on:change type="email" {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {:else if type === 'keypad'}
    <input disabled={readonly !== false ? 'disable' : false} {readonly} on:change type="number" use:imask={$$props.mask !== undefined ? $$props.mask : {mask:'000000'}} {name} bind:value class="peer {classes}" {placeholder}  style={style !== undefined ? style : ''}/>
  {:else if type === 'number'}
    <Number disabled={readonly !== false ? 'disable' : false} {readonly} on:change bind:value class="peer {classes}" min={$$props.min !== undefined ? $$props.min : undefined} max={$$props.max !== undefined ? $$props.max : undefined} style={style !== undefined ? style : ''}/>
  {:else if type === 'password'}
    <input disabled={readonly !== false ? 'disable' : false} {readonly} on:change type="password" {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {:else}
    <input disabled={readonly !== false ? 'disable' : false} {readonly} on:change use:imask={$$props.mask !== undefined ? $$props.mask : undefined} type="text" {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {/if}
</InputContainer>