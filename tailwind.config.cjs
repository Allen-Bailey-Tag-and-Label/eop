const config = {
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/sveltewind/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				'abtl-red': '#C10F2A',
				'abtl-blue': '#1C2B4F'
			}
		}
	},

	plugins: []
};

module.exports = config;
