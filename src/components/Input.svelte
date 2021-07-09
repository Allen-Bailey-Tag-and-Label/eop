<script>
  // props ( external )
  export let backgroundColor = 'bg-transparent';
  export let boxShadow       = '';
  export let fontWeight      = 'font-medium';
  export let name            = '';
  export let outline         = 'outline-none focus:outline-none';
  export let padding         = 'px-[22px] py-[11px]'
  export let placeholder     = '';
  export let ring            = 'ring ring-white ring ring-opacity-0 focus:ring-opacity-10 ring-offset ring-offset-1 ring-offset-gray-400 hover:ring-offset-gray-200 focus:ring-offset-gray-200';
  export let rounded         = 'rounded';
  export let shadow          = '';
  export let textAlign       = '';
  export let textColor       = '';
  export let textSize        = '';
  export let transition      = 'transition duration-200';
  export let type            = '';
  export let style           = '';
  export let whitespace      = 'whitespace-nowrap';
  export let value;

  // props ( dynamic )
  $: classes = `${backgroundColor} ${boxShadow} ${fontWeight} ${outline} ${padding} ${ring} ${rounded} ${shadow} ${textAlign} ${textColor} ${textSize} ${transition} ${whitespace} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

{#if type === 'email'}
  <input type="email" {name} bind:value class={classes} {placeholder} style={style !== undefined ? style : ''}/>
{:else if type === 'number'}
  <input type="number" {name} bind:value class={classes} {placeholder} style={style !== undefined ? style : ''}/>
{:else if type === 'password'}
  <input type="password" {name} bind:value class={classes} {placeholder} style={style !== undefined ? style : ''}/>
{:else}
  <input type="text" {name} bind:value class={classes} {placeholder} style={style !== undefined ? style : ''}/>
{/if}