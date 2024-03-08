const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/sveltewind/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: colors.violet,
				slate: {
					50: '#f9f8fb',
					100: '#f1eef6',
					200: '#e2deed',
					300: '#cbc3df',
					400: '#9788bf',
					500: '#665298',
					600: '#493b6d',
					700: '#352b50',
					800: '#1f192e',
					900: '#100c17',
					950: '#09070d'
				}
			}
		}
	},

	plugins: [
		plugin(({ addVariant }) => {
			addVariant('pwa', '@media all and (display-mode: standalone)');
		})
	]
};

module.exports = config;
