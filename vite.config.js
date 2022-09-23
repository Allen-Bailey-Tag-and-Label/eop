import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';
import vitePluginSocketIO from 'vite-plugin-socket-io';
import { serverEvents, socketEvents } from './src/lib/socketio/events';

const config = {
  plugins: [sveltekit(), vitePluginSocketIO({ serverEvents, socketEvents })],
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
