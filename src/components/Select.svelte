<script>
  // components
  import MultiSelect from 'svelte-multiselect/MultiSelect.svelte'

  // props ( external )
  export let label = '';
  export let name = '';
  export let options = [];
  export let multiple = false;
  export let placeholder = '';
  export let readonly = false;
  export let value;

  // props css ( external )
  export let appearance      = '';
  export let backgroundColor = 'bg-transparent';
  export let boxShadow       = '';
  export let cursor          = 'cursor-pointer';
  export let flex            = 'flex-grow'
  export let fontWeight      = 'font-medium';
  export let outline         = 'outline-none focus:outline-none';
  export let padding         = 'px-[11px] py-[11px]'
  export let ring            = 'ring ring-white ring ring-opacity-0 focus:ring-opacity-10 ring-offset ring-offset-1 ring-offset-gray-400 hover:ring-offset-gray-200 focus:ring-offset-gray-200 focus-within:ring-offset-gray-200 focus-within:border-0';
  export let rounded         = 'rounded';
  export let shadow          = '';
  export let textAlign       = '';
  export let textColor       = '';
  export let textSize        = '';
  export let transition      = 'transition duration-200';
  export let style           = '';
  export let whitespace      = 'whitespace-nowrap';

  // props ( dynamic )
  $: if ( !('appearance' in $$props) && readonly) appearance = 'appearance-none'
  $: if ( !('cursor' in $$props) && readonly) cursor = 'cursor-default'
  $: if ( !('ring' in $$props) && readonly) ring = 'shadow-underline'
  $: if ( !('rounded' in $$props) && readonly) rounded = ''
  $: classes = `${appearance} ${backgroundColor} ${boxShadow} ${cursor} ${flex} ${fontWeight} ${outline} ${padding} ${ring} ${rounded} ${shadow} ${textAlign} ${textColor} ${textSize} ${transition} ${whitespace} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

<div class="{label !== '' ? 'pt-[32px] relative flex' : ''}">
  {#if multiple}
    <MultiSelect bind:selected={value} {options} {placeholder} disabled={readonly !== false ? 'disable' : false} {readonly} outerDivClass="peer p-[11px] flex-grow m-0" --sms-options-bg="var(#f00, white)"  />
  {:else}
    <select class="peer {classes}" disabled={readonly !== false ? 'disable' : false} {readonly} bind:value on:change {style}>
      {#each options as option}}
        <option value={option.value} class="text-white bg-gray-800 checked:bg-blue-500 checked:text-white hover:bg-blue-500 hover:text-white py-[.25rem]">{option.label}</option>
      {/each}
    </select>
  {/if}
  {#if label !== ''}
    <label for={name} class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] origin-top-left px-[0px] py-[11px] {transition} peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:px-[22px] peer-placeholder-shown:opacity-[.5]">{label}</label>
  {/if}
</div>