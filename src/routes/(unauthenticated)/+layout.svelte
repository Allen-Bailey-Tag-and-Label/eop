<script lang="ts">
</script>

<div
  class="flex flex-col justify-center items-center min-h-[100dvh] max-h-[100dvh] pwa:min-h-[100vh] pwa:max-h-[100vh] lg:grid lg:grid-cols-2"
>
  <div class="relative bg-violet-50 dark:bg-violet-950 h-full">
    <img
      alt="Portal"
      class="hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-h-full min-w-full object-cover mix-blend-multiply dark:mix-blend-normal invert dark:invert-0 hue-rotate-[38deg] dark:hue-rotate-[218deg] lg:block"
      src="/unsplash/jeremy-perkins-UgNjyPkphtU-unsplash.jpg"
    />
  </div>
  <div class="flex flex-col flex-grow justify-center items-center">
    <slot />
  </div>
</div>
