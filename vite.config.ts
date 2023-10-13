import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

const config = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$actions: resolve('./src/actions'),
			$components: resolve('./src/components'),
			$icons: resolve('./src/icons'),
			$routes: resolve('./src/routes'),
			$src: resolve('./src'),
			$stores: resolve('./src/stores')
		}
	}
};

export default config;
