/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/sveltewind/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: {
        slate: {
          50: '#faf9fb',
          100: '#f1f0f4',
          200: '#e4e1ea',
          300: '#cecad8',
          400: '#9d95b2',
          500: '#70658b',
          600: '#4e4762',
          700: '#393347',
          800: '#18161d',
          900: '#110f15',
          950: '#09090c'
        },
        violet: {
          50: '#f8f5fe',
          100: '#eee7fe',
          200: '#dccffc',
          300: '#c1a8fa',
          400: '#8251f6',
          500: '#4b0cdf',
          600: '#3608a0',
          700: '#270674',
          800: '#170444',
          900: '#0b0222',
          950: '#070113'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      }
    }
  },

  plugins: []
};

module.exports = config;
