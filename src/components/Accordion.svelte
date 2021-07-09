<script>
  // _imports
  import { slide } from 'svelte/transition';

  // components
  import Icon, { ChevronDown } from 'svelte-hero-icons';

  // props ( external )
  export let containerClasses = 'border-gray border-opacity-30 border-b-[1px]';
  export let descriptionClasses = 'text-gray leading-[30px] py-[18px]';
  export let handleClasses = 'py-[21px] lg:py-[20px]';
  export let items = [
    {title: 'Item 1', description: 'Description', visible: false},
    {title: 'Item 2', description: 'Description', visible: false},
    {title: 'Item ', description: 'Description', visible: false},
  ];
</script>

{#each items as {title, description, visible}}
  <div class="flex flex-col {containerClasses}">
    <div on:click={()=>visible = !visible} class="flex justify-between items-center cursor-pointer {handleClasses}">
      <div>{title}</div>
      <Icon src={ChevronDown} class="transform transition duration-200 {visible?'rotate-180 text-red':'rotate-0 text-primary'}" />
    </div>
    {#if visible}
      <div transition:slide class={descriptionClasses}>{description}</div>
    {/if}
  </div>
{/each}