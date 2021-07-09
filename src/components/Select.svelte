<script>
  // components
  import MultiSelect from 'svelte-multiselect/MultiSelect.svelte'

  // props ( external )
  export let options = [];
  export let multiple = false;
  export let placeholder = '';
  export let value;

  // props css ( external )
  export let backgroundColor = 'bg-transparent';
  export let boxShadow       = '';
  export let cursor          = 'cursor-pointer';
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
  $: classes = `${backgroundColor} ${boxShadow} ${cursor} ${fontWeight} ${outline} ${padding} ${ring} ${rounded} ${shadow} ${textAlign} ${textColor} ${textSize} ${transition} ${whitespace} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

{#if multiple}
  <MultiSelect bind:selected={value} {options} {placeholder} --sms-options-bg="var(#f00, white)"  />
{:else}
  <select class={classes} bind:value on:change {style}>
    {#each options as option}}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
{/if}