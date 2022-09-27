<script>
  import { slide } from 'svelte/transition';
  import { Icon, NavLink } from '$components';
  import { ChevronRight } from '$icons';

  // props (internal)
  let open = false;

  // props (external)
  export let group;
  export let toggleNav;
</script>

<div class="flex flex-col">
  <div
    class="text-[.875rem] px-[2rem] py-[.75rem] cursor-pointer hover:bg-black/[.1] dark:hover:bg-white/[.1] flex justify-between items-center"
    on:click={() => (open = !open)}
  >
    <div>
      {group.title}
    </div>
    <Icon
      class="w-[.875rem] h-[.875rem transition duration-200 {!open ? 'rotate-0' : 'rotate-90'}"
      src={ChevronRight}
    />
  </div>
  {#if open}
    <div transition:slide class="flex flex-col bg-black/[.1] dark:bg-black/[.2]">
      {#each group.items as { href, innerHTML }}
        <NavLink {href} {open} {toggleNav}>{innerHTML}</NavLink>
      {/each}
    </div>
  {/if}
</div>
