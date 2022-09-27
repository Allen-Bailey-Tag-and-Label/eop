<script>
  import { slide } from 'svelte/transition';
  import { Icon, NavLink } from '$components';
  import { ChevronRight } from '$icons';
  import { theme } from '$stores';

  // props (internal)
  let open = false;

  // props (external)
  export let group;
  export let toggleNav;
</script>

<div class="flex flex-col">
  <div class={$theme.navGroupTitle} on:click={() => (open = !open)}>
    <div>
      {group.title}
    </div>
    <Icon
      class="w-[1rem] h-[1rem] transition duration-200 {!open ? 'rotate-0' : 'rotate-90'}"
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
