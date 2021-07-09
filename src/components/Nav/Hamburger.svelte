<script>
  // props ( external )
  export let toggleMenu;
  export let show;
</script>

<div on:click={toggleMenu} class="relative cursor-pointer w-[24px] h-[24px] z-30 pointer-events-auto group">
  <div class="absolute z-30 w-full h-[1px] bg-gray-200 group-hover:bg-primary-500 transform transition duration-200 top-1/2 left-0 {show?'-translate-y-1/2 rotate-45':'translate-y-[-9px] rotate-0'}"></div>
  <div class="absolute z-30 w-full h-[1px] bg-gray-200 group-hover:bg-primary-500 transform transition duration-200 top-1/2 left-0 translate-y-[-1px] {show?'opacity-0':'opacity-100'}"></div>
  <div class="absolute z-30 w-full h-[1px] bg-gray-200 group-hover:bg-primary-500 transform transition duration-200 top-1/2 left-0 {show?'-translate-y-1/2 -rotate-45':'translate-y-[7px] rotate-0'}"></div>
</div>