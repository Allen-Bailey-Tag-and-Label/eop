<script>
  import { Nav } from 'sveltewind/components';
  import { goto } from '$app/navigation';
  import { Button, Icon, NavGroup, NavLink } from '$components';
  import { MenuAlt4, X } from '$icons';
  import { socketio, theme } from '$stores';

  // utilities

  // handlers
  const signOutHandler = async (e) => {
    e.preventDefault();
    await fetch('/api/auth?/signout', { body: new FormData(), method: 'POST' });
    socketio.signout();
    goto('/signin');
  };
  const toggleNav = () => (open = !open);

  // props (internal)
  let open = false;

  // props (external)
  export let routes = [];

  // props (dynamic)
</script>

<Button
  class="{$theme.buttonIcon} {$theme.buttonTransparent} z-[3] hover:text-primary-500 focus:text-primary-500"
  on:click={toggleNav}
>
  <Icon class="w-[2rem] h-[2rem]" src={!open ? MenuAlt4 : X} />
</Button>
<div
  class="z-[2] cursor-pointer fixed top-0 left-0 w-screen h-screen bg-black/[.7] transition duration-200 {!open
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 pointer-events-auto'}"
  on:click={toggleNav}
/>
<Nav class={!open ? 'translate-x-full lg:-translate-x-full' : 'translate-x-0'}>
  <div class="flex flex-col flex-grow justify-between">
    <div class="flex flex-col">
      {#each routes as group}
        <div class={$theme.navGroupContainer}>
          {#if !group.title}
            {#each group.items as { href, innerHTML }}
              <NavLink class="pl-[2rem]" {href} {open} {toggleNav}>{innerHTML}</NavLink>
            {/each}
          {:else}
            <NavGroup {group} {toggleNav} />
          {/if}
        </div>
      {/each}
    </div>
    <NavLink class="pl-[2rem]" clickHandler={signOutHandler} href="/signout" {open}>Signout</NavLink
    >
  </div>
</Nav>
