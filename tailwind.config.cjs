const { tailwindcssPaletteGenerator } = require('@bobthered/tailwindcss-palette-generator');
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/sveltewind/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: tailwindcssPaletteGenerator({
				colors: ['#6366f1', '#0ea5e9', '#a855f7', '#a2a3b3'],
				names: ['primary', 'secondary', 'tertiary', 'gray'],
				shades: [
					{ name: '50', lightness: 98 },
					{ name: '100', lightness: 95 },
					{ name: '200', lightness: 90 },
					{ name: '300', lightness: 82 },
					{ name: '400', lightness: 64 },
					{ name: '500', lightness: 46 },
					{ name: '600', lightness: 33 },
					{ name: '700', lightness: 20 },
					{ name: '800', lightness: 10 },
					{ name: '900', lightness: 7 },
					{ name: '950', lightness: 4 }
				]
			}),
			fontFamily: {
				sans: ['Montserrat', 'sans-serif']
			},
			transitionTimingFunction: {
				'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
			}
		}
	},

	plugins: []
};

module.exports = config;
