<script lang="ts">
  import { Pwa } from 'sveltewind/components';
</script>

<Pwa>
  <link rel="alternate icon" href="/icons/icon-16x16.png" />
  <link rel="apple-touch-icon" href="/icons/icon-apple-touch.png" />
  <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover"
  />
  <meta name="theme-color" content="#09090C" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</Pwa>
