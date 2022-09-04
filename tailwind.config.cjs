const paletteGenerator = require('@bobthered/tailwindcss-palette-generator');

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/sveltewind/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: paletteGenerator({
        colors: ['#3b82f6', '#757575'],
        names: ['primary', 'gray']
      }),
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      }
    }
  },

  plugins: []
};

module.exports = config;
