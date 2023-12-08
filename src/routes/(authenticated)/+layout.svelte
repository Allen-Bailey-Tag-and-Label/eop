<script lang="ts">
  import { Header } from '$components';
</script>

<div class="min-h-[100dvh] max-h-[100dvh] flex flex-col lg:flex-row">
  <div class="flex flex-col flex-grow overflow-auto lg:order-2">
    <slot />
  </div>
  <Header />
</div>
