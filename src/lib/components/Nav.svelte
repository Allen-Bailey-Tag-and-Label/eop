<script>
  import { A, Button, H6, Icon, Nav } from 'sveltewind/components';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { MenuAlt4, X } from '$icons';
  import { postFetch } from '$lib/helpers';
  import { socketio, theme } from '$stores';

  // utilities

  // handlers
  const signOutHandler = async (e) => {
    e.preventDefault();
    const response = await postFetch({ url: '/api/auth/signout' });
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

<Button class="{$theme.buttonIcon} {$theme.buttonTransparent} z-[3]" on:click={toggleNav}>
  <Icon class="w-[2rem] h-[2rem]" src={!open ? MenuAlt4 : X} />
</Button>
<div
  class="z-[2] cursor-pointer fixed top-0 left-0 w-screen h-screen bg-black/[.7] transition duration-200 {!open
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 pointer-events-auto'}"
  on:click={toggleNav}
/>
<Nav class={!open ? 'translate-x-full lg:-translate-x-full' : 'translate-x-0'}>
  <div class="flex flex-col space-y-[2rem]">
    {#each routes as group}
      <div class={$theme.navGroupContainer}>
        {#if group.title}
          <H6 class={$theme.navGroupTitle}>{group.title}</H6>
        {/if}
        {#each group.items as { href, innerHTML }}
          <a
            class="{$theme.a} {$theme.navA} {$page.url.pathname === href ? $theme.navACurrent : ''}"
            {href}
            on:click={toggleNav}
            tabindex={!open ? '-1' : '0'}
            >{innerHTML}
          </a>
        {/each}
      </div>
    {/each}
  </div>
  <a
    class="{$theme.a} {$theme.navA}"
    href="/signin"
    on:click={signOutHandler}
    tabindex={!open ? '-1' : '0'}
  >
    Signout
  </a>
</Nav>
