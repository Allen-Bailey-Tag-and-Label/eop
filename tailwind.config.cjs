const paletteGenerator = require('@bobthered/tailwindcss-palette-generator');

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/sveltewind/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: paletteGenerator({
        colors: ['#0b5ce0', '#5e708d'],
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
