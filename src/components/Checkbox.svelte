<script>
  // components
  import Icon, { Check } from 'svelte-hero-icons';

  // props ( external )
  export let checked = false;
  export let disabled = false;
  export let indeterminate = false;
  export let label = '';
  export let name = '';

  // props ( dynamic )
  $: classes = `relative focus-within:ring-opacity-10 flex cursor-pointer transition duration-200 rounded ring ring-opacity-0 ${(checked||indeterminate)?'bg-primary-500 ring-primary-500 text-gray-900 focus-within:ring-opacity-30':'bg-transparent ring-white ring-offset ring-offset-1 ring-offset-gray-400 hover:ring-offset-gray-200'} ${$$props.class}`
</script>

{#if label !== ''}
  <div class="pt-[32px] relative flex">
    <label class={classes}>
      <input type="checkbox" on:change bind:checked bind:indeterminate disabled class="absolute top-0 left-0 w-0 opacity-0" />
      {#if checked}
        <Icon src={Check} class="w-[24px] h-[24px] pointer-events-none" />
      {:else if indeterminate}
        <div class="w-[24px] h-[24px]">-</div>
      {:else}
        <div class="w-[24px] h-[24px] pointer-events-none" />
      {/if}
    </label>
    <label for={name} class="absolute left-0 transform translate-y-[-40px] pointer-events-none opacity-[1] scale-[.9] translate-x-[0] origin-top-left py-[11px] transition duration-200 peer-placeholder-shown:translate-x-[22px] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-[1] peer-placeholder-shown:opacity-[.5]">{label}</label>
  </div>
{:else}
  <label class={classes}>
    <input type="checkbox" on:change bind:checked bind:indeterminate disabled class="absolute top-0 left-0 w-0 opacity-0" />
    {#if checked}
      <Icon src={Check} class="w-[24px] h-[24px] pointer-events-none" />
    {:else if indeterminate}
      <div class="w-[24px] h-[24px]">-</div>
    {:else}
      <div class="w-[24px] h-[24px] pointer-events-none" />
    {/if}
  </label>
{/if}