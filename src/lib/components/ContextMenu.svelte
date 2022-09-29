<script>
  import { twMerge } from 'tailwind-merge';
  import { clickOutside } from '$actions';
  import { theme } from '$stores';

  // props (external)
  export let clickOutsideHandler = () => (show = false);
  export let contextmenuHandler = (e) => {
    e.preventDefault();
    position = {
      x: mousePosition.x - (mousePosition.x > windowWidth / 2 ? elem.offsetWidth : 0),
      y: mousePosition.y - (mousePosition.y > windowHeight / 2 ? elem.offsetHeight : 0)
    };
    show = true;
  };
  export let elem;
  export let mouseMoveHandler = ({ clientX, clientY }) => {
    mousePosition.x = clientX;
    mousePosition.y = clientY;
  };
  export let mousePosition = {
    x: 0,
    y: 0
  };
  export let position = { x: 0, y: 0 };
  export let show = false;
  export let windowHeight;
  export let windowWidth;
</script>

<svelte:window
  bind:outerHeight={windowHeight}
  bind:outerWidth={windowWidth}
  on:mousemove={mouseMoveHandler}
/>

<div
  bind:this={elem}
  class={twMerge(
    $theme.card,
    'fixed z-[3] transition duration-200',
    !show ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto',
    $$props.class
  )}
  style="left: {position.x}px; top: {position.y}px;"
  use:clickOutside={clickOutsideHandler}
>
  <slot />
</div>
