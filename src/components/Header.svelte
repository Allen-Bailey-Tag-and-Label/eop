<script>
  // components
  import Container from "./Container.svelte";
  import Nav from "./Nav";

  // props ( external )
  export let routes = [];
</script>

<header
  class="flex w-full justify-center absolute top-0 left-0 py-[38px] z-20 lg:py-[54px]">
  <Container>
    <div class="flex justify-end items-center">
      <Nav {routes} />
    </div>
  </Container>
</header>
