<script>
  // _imports
  import { imask } from '@imask/svelte';

  // components
  import Date from './Date.svelte';
  import Number from './Number.svelte';

  // props ( external )
  export let label           = '';
  export let name            = '';
  export let placeholder     = '';
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

  // props ( dynamic )
  $: classes = `${appearance} ${backgroundColor} ${boxShadow} ${flex} ${fontWeight} ${outline} ${padding} placeholder-transparent ${ring} ${rounded} ${shadow} ${textAlign} ${textColor} ${textSize} ${transition} ${whitespace} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

<div class="{label !== '' ? 'pt-[32px] relative flex' : ''}">
  {#if type === 'date'}
    <Date on:change {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {:else if type === 'email'}
    <input on:change type="email" {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {:else if type === 'keypad'}
    <input on:change type="number" use:imask={$$props.mask !== undefined ? $$props.mask : {mask:'000000'}} {name} bind:value class="peer {classes}" {placeholder}  style={style !== undefined ? style : ''}/>
  {:else if type === 'number'}
    <Number on:change bind:value class="peer {classes}" min={$$props.min !== undefined ? $$props.min : undefined} max={$$props.max !== undefined ? $$props.max : undefined} style={style !== undefined ? style : ''}/>
  {:else if type === 'password'}
    <input on:change type="password" {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {:else}
    <input on:change use:imask={$$props.mask !== undefined ? $$props.mask : undefined} type="text" {name} bind:value class="peer {classes}" {placeholder} style={style !== undefined ? style : ''}/>
  {/if}
  {#if label !== ''}
    <label for={name} class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] {transition} peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">{label}</label>
  {/if}
</div>