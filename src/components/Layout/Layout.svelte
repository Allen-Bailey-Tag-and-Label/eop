<script>
  // imports
  import { onMount } from 'svelte';
  import { Icon, MenuAlt4, X } from 'svelte-hero-icons';
  import {
    Button,
    Header,
    Logo,
    Main,
    Mongodb,
    Nav,
    Overlay,
    ProgressIndicator,
    Pwa,
    SafeArea,
    Socket,
    Title
  } from '@components';
  import { pageLoaded, socket, theme } from '@stores';
  import { twMerge } from 'tailwind-merge';
  import '../../app.css';

  // props (internal)
  let navIsOpen = false;

  // props (external)
  export let showHeader = true;

  // props (dynamic)
  $: overlayClasses =
    Object.values($pageLoaded).filter((bool) => !bool).length === 0
      ? 'opacity-0 pointer-events-none'
      : 'opacity-100 pointer-events-auto';

  // lifecycle
  onMount(() => {
    $pageLoaded.__layout = true;
  });
</script>

<Mongodb />
<Pwa>
  <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
</Pwa>
<Socket />
<Title base="Employee Online Portal - Allen Bailey Tag & Label" />

<Main>
  <SafeArea class="overflow-y-auto">
    <slot />
  </SafeArea>
  {#if showHeader}
    <Header class="relative z-[2]">
      <Button
        class="px-[.5rem] bg-transparent focus:ring-white/[.3] hover:bg-transparent focus:bg-transparent"
        on:click={() => (navIsOpen = !navIsOpen)}
      >
        <Icon class="w-[1.5rem] h-[1.5rem]" src={MenuAlt4} />
      </Button>
      <Overlay
        class={twMerge(
          'fixed top-0 left-0 transition duration-200 cursor-pointer dark:bg-black/[.3]',
          navIsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        on:click={() => (navIsOpen = !navIsOpen)}
      />
      <SafeArea
        class={twMerge(
          'fixed top-0 right-0 flex flex-col h-full transform transition duration-200 items-end bg-white ring-1 ring-black/[.1] dark:bg-gray-900 dark:ring-white/[.05] lg:right-auto lg:left-0 lg:items-start lg:flex-col-reverse',
          navIsOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-[-100%]'
        )}
      >
        <Nav>
          test<br />tasdrf<br />adsfr<br />asdf
        </Nav>
      </SafeArea>
    </Header>
  {/if}
</Main>

<Overlay
  class={twMerge(
    'transition duration-200 flex items-center justify-center h-screen fixed top-0 left-0 z-[999] bg-gray-50 dark:bg-gray-900 flex-grow',
    overlayClasses
  )}
>
  <div class="flex flex-col space-y-[2rem] items-center justify-center">
    <Logo />
    <ProgressIndicator class="w-[3rem] h-[3rem]" />
  </div>
</Overlay>
