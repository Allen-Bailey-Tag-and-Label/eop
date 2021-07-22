import adapter from '@sveltejs/adapter-node';
// import adapter from '@sveltejs/adapter-static';
import fs from 'fs';
import path from 'path';
import preprocess from 'svelte-preprocess';

const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf8'));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
  kit: {
    adapter: adapter(),
    target: '#svelte',
    vite: {
      resolve: {
        alias: {
          $components: path.resolve('./src/components'),
          $css: path.resolve('./src/css'),
          $data: path.resolve('./src/data'),
          $sections: path.resolve('./src/sections'),
          $stores: path.resolve('./src/stores'),
        },
      },
      ssr:{
        noExternal: Object.keys(pkg.dependencies || {}),
      }
    },
  },
};

export default config;