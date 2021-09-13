<script>
  // _imports
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import auth from '$lib/auth';

  // components
  import { Hamburger } from './Nav';

  // handlers
  const toggleMenu = () => show = !show;
  const signOut = () => {
    toggleMenu();
    modal.spinner.show();
    auth.signout();
    modal.spinner.hide();
    goto('/signin')
  }

  // props ( internal )
  const linkClasses = 'px-[24px] py-[8px] transition duration-200 lg:px-[72px]'

  // props ( external )
  export let routes = [];
  export let show = false;

  // props ( dynamic )
  $: groupedRoutes = [...routes]
    .sort((a,b)=>{
      const compareA = `${'group' in a ? a.group : ' '}${a.name}`;
      const compareB = `${'group' in b ? b.group : ' '}${b.name}`;
      if ( compareA < compareB ) return -1;
      if ( compareA > compareB ) return 1;
      return 0;
    }).reduce((obj, route) => {
    if ( 'group' in route ) {
      const { group } = route;
      if ( !(group in obj) ) obj[group] = [];
      obj[group].push(route);
    } else {
      if ( !('' in obj) ) obj[''] = [];
      obj[''].push(route);
    }
    return obj;
  }, {});

  // stores
  import modal from '$components/Modal/store';
</script>


<div class="flex flex-col fixed top-0 left-0 z-10 w-screen h-screen py-[24px] pb-[160px] ring ring-1 justify-between transform transition duration-200 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-track-rounded-full {show?'translate-x-0':'translate-x-[100%] lg:translate-x-[-100%]'} ring-white ring-opacity-[2%] ring-inset backdrop-filter backdrop-blur-md bg-white bg-opacity-[2%] lg:w-auto lg:pb-[24px]">
  <div class="flex flex-col space-y-[32px] mt-[-8px] pb-[32px]">
    {#each Object.keys(groupedRoutes) as group}
      <div class="flex flex-col">
        {#if group !== ''}
            <div class="uppercase text-white font-bold {linkClasses}">{group}</div>
        {/if}
        {#each groupedRoutes[group] as {href, name}}
          {#if href === $page.path.replace(/\add/g,'')}
            <div class="flex relative">
              <div class="absolute top-0 right-0 bg-primary-500 h-full w-[2px]"/>
              <a on:click={toggleMenu} {href} class="text-primary-500 cursor-default {linkClasses}">{name}</a>
            </div>
          {:else}
            <a on:click={toggleMenu} {href} class="hover:text-primary-500 {linkClasses}">{name}</a>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
  <div class="flex mb-[-8px]">
    <a on:click|preventDefault={signOut} href="/signout" class="w-full hover:text-primary-500 {linkClasses}">Sign Out</a>
  </div>
</div>
<div style="padding-bottom:calc(12px + env(safe-area-inset-bottom))" class="backdrop-blur-md fixed bottom-0 left-0 z-10 w-full flex justify-end px-[24px] py-[12px] ring ring-1 ring-white pointer-events-none lg:relative lg:bottom-auto lg:left-auto lg:w-auto lg:h-auto lg:bg-transparent lg:p-[24px] {show?'ring-opacity-[2%] lg:ring-opacity-[0%]' : 'ring-opacity-[2%]'}">
  <Hamburger bind:show {toggleMenu} />
</div>