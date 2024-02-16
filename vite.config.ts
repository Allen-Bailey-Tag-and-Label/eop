import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
		  $actions: resolve('./src/actions'),
		  $components: resolve('./src/components'),
		  $icons: resolve('./src/icons'),
		  $stores: resolve('./src/stores'),
		  $transitions: resolve('./src/transitions'),
		  $utilities: resolve('./src/utilities')
		}
	  },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
