const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      animation: {
        'spinner-rotate' : 'spinner-rotate 2s linear infinite',
        'spinner-dash'   : 'spinner-dash 1.5s ease-in-out infinite'
      },
      keyframes:{
        'spinner-rotate':{
          '100%' : { transform: 'rotate(360deg)' },
        },
        'spinner-dash' :{
          '0%' : {
            'stroke-dasharray' : '1, 200',
            'stroke-dashoffset' : '0'
          },
          '50%' : {
            'stroke-dasharray' : '89, 200',
            'stroke-dashoffset' : '-35px'
          },
          '100%' : {
            'stroke-dasharray' : '89, 200',
            'stroke-dashoffset' : '-124px'
          },
        }
      },
      colors: {
        primary: {
          50: '#e9f8ff',
          100: '#c3ecfc',
          200: '#8ed1ec',
          300: '#55b6de',
          400: '#3ca2cc',
          500: '#2a8cb4',
          DEFAULT: '#2a8cb4',
          600: '#2584ad',
          700: '#1f79a4',
          800: '#196f9c',
          900: '#0f5c8c',
          A100: '#bee3ff',
          A200: '#8bceff',
          A400: '#58b8ff',
          A700: '#3eaeff',
        },
        gray: {
          50: '#e4e4e5',
          100: '#bcbcbf',
          200: '#8f9094',
          300: '#626369',
          400: '#404149',
          500: '#1e2029',
          DEFAULT: '#1e2029',
          600: '#1a1c24',
          700: '#16181f',
          800: '#121319',
          900: '#0a0b0f',
          A100: '#548dff',
          A200: '#216bff',
          A400: '#004fed',
          A700: '#0047d4',
        },
        warning: colors.orange
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      transitionDelay: {
        0: '0ms',
        100: '100ms',
        200: '200ms',
        300: '300ms',
        400: '400ms',
        500: '500ms',
        600: '600ms',
        700: '700ms',
        800: '800ms',
        900: '900ms',
        1000: '1000ms',
        1100: '1100ms',
        1200: '1200ms',
        1300: '1300ms',
        1400: '1400ms',
        1500: '1500ms',
        1600: '1600ms',
        1700: '1700ms',
        1800: '1800ms',
      },
      zIndex: {
        'auto': 'auto',
        '-1': '-1',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
};
