import _ from 'dotenv/config';
import path from 'path';
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';
import vitePluginSocketIO from 'vite-plugin-socket-io';
import { serverEvents, socketEvents } from './src/lib/socket-io/index.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      entryPoint: ['./server.js']
    }),
    vite: {
      plugins: [
        vitePluginSocketIO({
          serverEvents,
          socketEvents
        })
      ],
      resolve: {
        alias: {
          '@components': path.resolve('./src/components'),
          '@lib': path.resolve('./src/lib'),
          '@routes': path.resolve('./src/routes'),
          '@stores': path.resolve('./src/stores')
        }
      },
      ssr: {
        noExternal: ['sveltewind']
      }
    }
  },

  preprocess: [
    preprocess({
      postcss: true
    })
  ]
};

export default config;
