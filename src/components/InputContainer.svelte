<script>
  // props external
  export let label = '';

  // props css ( external )
  export let transition = 'transition duration-200';
</script>

<div class={'class' in $$props ? $$props.class : 'pt-[32px] relative flex'}>
  <slot />
  {#if label !== ''}
    <label for={name} class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] {transition} peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">{label}</label>
  {/if}
</div>