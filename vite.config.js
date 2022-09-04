import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

const config = {
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $components: resolve('./src/lib/components'),
      $db: resolve('./src/lib/db'),
      $icons: resolve('./src/lib/icons'),
      $stores: resolve('./src/lib/stores'),
      $themes: resolve('./src/lib/themes')
    }
  }
};

export default config;
