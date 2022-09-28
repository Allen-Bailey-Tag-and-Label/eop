import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';
import injectSocketIO from './src/lib/socketio/injectSocketIO';

const webSocketServer = {
  name: 'webSocketServer',
  configureServer(server) {
    injectSocketIO(server.httpServer);
  }
};

const config = {
  plugins: [sveltekit(), webSocketServer],
  resolve: {
    alias: {
      $actions: resolve('./src/lib/actions'),
      $components: resolve('./src/lib/components'),
      $db: resolve('./src/lib/db'),
      $icons: resolve('./src/lib/icons'),
      $stores: resolve('./src/lib/stores'),
      $themes: resolve('./src/lib/themes')
    }
  }
};

export default config;
