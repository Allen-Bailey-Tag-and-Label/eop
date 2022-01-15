// imports
import adapter from '@sveltejs/adapter-node';
import path from 'path';
import preprocess from 'svelte-preprocess';
import vitePluginSocketIo from 'vite-plugin-socket-io';
import { serverEvents, socketEvents } from './src/lib/socketio/index.js';

const config = {
	kit: {
		adapter: adapter({
			entryPoint: ['./server.js'],
			env: {
				port: process.env.PORT | 3000,
				host: '0.0.0.0'
			}
		}),
		target: '#svelte',
		vite: {
			plugins: [vitePluginSocketIo({ serverEvents, socketEvents })],
			resolve: {
				alias: {
					$actions: path.resolve('./src/actions'),
					$components: path.resolve('./src/components'),
					$css: path.resolve('./src/css'),
					$data: path.resolve('./src/data'),
					$emailTemplates: path.resolve('./src/emailTemplates'),
					$excelTemplates: path.resolve('./src/excelTemplates'),
					$routes: path.resolve('./src/routes'),
					$sections: path.resolve('./src/sections'),
					$stores: path.resolve('./src/stores'),
				}
			}
		}
	},
	preprocess: [preprocess({})]
};

export default config;
