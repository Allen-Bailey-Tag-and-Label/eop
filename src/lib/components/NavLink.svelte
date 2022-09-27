<script>
  import { twMerge } from 'tailwind-merge';
  import { page } from '$app/stores';
  import { theme } from '$stores';

  // props (external)
  export let href;
  export let open;
  export let toggleNav;
  export let clickHandler = () => toggleNav();
</script>

<a
  class={twMerge(
    $theme.a,
    $theme.navA,
    $page.url.pathname === href ? $theme.navACurrent : '',
    $$props.class
  )}
  {href}
  on:click={clickHandler}
  tabindex={!open ? '-1' : '0'}
>
  <slot />
</a>
