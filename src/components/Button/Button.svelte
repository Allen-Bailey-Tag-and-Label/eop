<script>
  // props ( external )
  export let bgOpacity  = 'bg-opacity-100';
  export let boxShadow  = '';
  export let fontWeight = 'font-bold';
  export let href       = '#';
  export let outline    = 'outline-none focus:outline-none';
  export let padding    = 'px-[30px] py-[11px]'
  export let ring       = 'ring ring-opacity-0 focus:ring-opacity-30';
  export let rounded    = 'rounded';
  export let textAlign  = 'text-center';
  export let textColor  = '';
  export let textSize   = '';
  export let theme      = 'default';
  export let transition = 'transition duration-200';
  export let type       = '';
  export let style      = '';
  export let whitespace = 'whitespace-nowrap';

  // props ( dynamic )
  $: if ( type === 'icon' ) {
    padding = 'p-[11px]'
  }
  $: themeClasses = theme === 'default' ? 'bg-primary-500 ring-primary-500 text-gray-900 hover:bg-primary-600' : 
                    theme === 'error' ? 'bg-red-500 ring-red-500 text-gray-900 hover:bg-red-600' : 
                    theme === 'success' ? 'bg-green-500 ring-green-500 text-gray-900 hover:bg-green-600' : '';
  $: classes = `${bgOpacity} ${boxShadow} ${fontWeight} ${outline} ${padding} ${ring} ${rounded} ${textAlign} ${textColor} ${textSize} ${themeClasses} ${transition} ${whitespace} ${$$props.class !== undefined ? $$props.class : ''}`;
</script>

{#if type === 'link'}
  <a {href} on:click class={classes} style={style !== undefined ? style : ''}><slot/></a>
{:else if type === 'submit'}
  <button on:click type="submit" class={classes} style={style !== undefined ? style : ''}><slot/></button>
{:else}
  <button on:click class={classes} style={style !== undefined ? style : ''}><slot>Button</slot></button>
{/if}